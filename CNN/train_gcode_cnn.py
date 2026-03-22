import os
import random
from collections import Counter
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader, random_split

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_ROOT = os.path.abspath(os.path.join(BASE_DIR, "..", "customModel", "data-prep"))

NON_GUN_DIR = os.path.join(DATA_ROOT, "g-code-non-gun")
GUN_DIR = os.path.join(DATA_ROOT, "g-code-spliced")

MAX_LEN = 4000
BATCH_SIZE = 16
EMBED_DIM = 64
NUM_EPOCHS = 10
LR = 1e-3
SEED = 42
VAL_SPLIT = 0.2

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

random.seed(SEED)
torch.manual_seed(SEED)

def strip_comments(line: str) -> str:
    if ';' in line:
        line = line.split(';', 1)[0]
    return line.strip()

def tokenize_gcode_line(line: str):
    line = strip_comments(line)
    if not line:
        return []

    parts = line.split()
    tokens = []

    if len(parts) > 0:
        cmd = parts[0].upper()
        tokens.append(cmd)

    for p in parts[1:]:
        p = p.strip().upper()
        if not p:
            continue
        letter = p[0]
        if letter.isalpha():
            tokens.append(letter)

    return tokens

def tokenize_gcode_file(path: str):
    tokens = []
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            toks = tokenize_gcode_line(line)
            tokens.extend(toks)
    return tokens

PAD_TOKEN = "<PAD>"
UNK_TOKEN = "<UNK>"

def build_vocab(file_paths, min_freq=1):
    counter = Counter()
    for path in file_paths:
        toks = tokenize_gcode_file(path)
        counter.update(toks)

    vocab = {
        PAD_TOKEN: 0,
        UNK_TOKEN: 1,
    }

    for token, freq in counter.items():
        if freq >= min_freq:
            vocab[token] = len(vocab)

    return vocab

def encode_tokens(tokens, vocab, max_len):
    ids = [vocab.get(tok, vocab[UNK_TOKEN]) for tok in tokens]
    if len(ids) > max_len:
        ids = ids[:max_len]
    else:
        ids = ids + [vocab[PAD_TOKEN]] * (max_len - len(ids))
    return ids

def collect_paths_and_labels():
    samples = []

    class_dirs = [
        (NON_GUN_DIR, 0),
        (GUN_DIR, 1),
    ]

    for class_dir, label in class_dirs:
        print(f"Checking: {class_dir}")

        if not os.path.isdir(class_dir):
            print(f"Missing directory: {class_dir}")
            continue

        for fname in os.listdir(class_dir):
            path = os.path.join(class_dir, fname)
            if os.path.isfile(path) and fname.lower().endswith(".gcode"):
                samples.append((path, label))

    return samples

class GCodeDataset(Dataset):
    def __init__(self, samples, vocab, max_len):
        self.samples = samples
        self.vocab = vocab
        self.max_len = max_len

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        tokens = tokenize_gcode_file(path)
        ids = encode_tokens(tokens, self.vocab, self.max_len)

        x = torch.tensor(ids, dtype=torch.long)
        y = torch.tensor(label, dtype=torch.float32)
        return x, y

class GCodeCNN(nn.Module):
    def __init__(self, vocab_size, embed_dim=64, num_filters=128, kernel_sizes=(3, 5, 7), dropout=0.3):
        super().__init__()

        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)

        self.convs = nn.ModuleList([
            nn.Conv1d(in_channels=embed_dim, out_channels=num_filters, kernel_size=k)
            for k in kernel_sizes
        ])

        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(num_filters * len(kernel_sizes), 1)

    def forward(self, x):
        emb = self.embedding(x)
        emb = emb.transpose(1, 2)

        conv_outs = []
        for conv in self.convs:
            c = torch.relu(conv(emb))
            p = torch.max(c, dim=2).values
            conv_outs.append(p)

        features = torch.cat(conv_outs, dim=1)
        features = self.dropout(features)

        logits = self.fc(features).squeeze(1)
        return logits

def binary_accuracy_from_logits(logits, labels):
    preds = (torch.sigmoid(logits) >= 0.5).float()
    return (preds == labels).float().mean().item()

def compute_confusion_stats(logits, labels):
    preds = (torch.sigmoid(logits) >= 0.5).long()
    labels = labels.long()

    tp = ((preds == 1) & (labels == 1)).sum().item()
    tn = ((preds == 0) & (labels == 0)).sum().item()
    fp = ((preds == 1) & (labels == 0)).sum().item()
    fn = ((preds == 0) & (labels == 1)).sum().item()
    return tp, tn, fp, fn

def precision_recall_f1(tp, fp, fn):
    precision = tp / (tp + fp + 1e-8)
    recall = tp / (tp + fn + 1e-8)
    f1 = 2 * precision * recall / (precision + recall + 1e-8)
    return precision, recall, f1

def run_epoch(model, loader, criterion, optimizer=None):
    is_train = optimizer is not None
    model.train() if is_train else model.eval()

    total_loss = 0.0
    total_acc = 0.0
    total_samples = 0

    total_tp = total_tn = total_fp = total_fn = 0

    for x, y in loader:
        x = x.to(DEVICE)
        y = y.to(DEVICE)

        with torch.set_grad_enabled(is_train):
            logits = model(x)
            loss = criterion(logits, y)

            if is_train:
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()

        batch_size = x.size(0)
        total_loss += loss.item() * batch_size
        total_acc += binary_accuracy_from_logits(logits, y) * batch_size
        total_samples += batch_size

        tp, tn, fp, fn = compute_confusion_stats(logits.detach(), y.detach())
        total_tp += tp
        total_tn += tn
        total_fp += fp
        total_fn += fn

    avg_loss = total_loss / max(total_samples, 1)
    avg_acc = total_acc / max(total_samples, 1)
    precision, recall, f1 = precision_recall_f1(total_tp, total_fp, total_fn)

    return {
        "loss": avg_loss,
        "acc": avg_acc,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "tp": total_tp,
        "tn": total_tn,
        "fp": total_fp,
        "fn": total_fn,
    }

def main():
    all_samples = collect_paths_and_labels()
    print(f"Total samples found: {len(all_samples)}")

    if len(all_samples) == 0:
        raise ValueError("No .gcode files found. Check DATA_ROOT and folder names.")

    random.shuffle(all_samples)

    split_idx = int((1.0 - VAL_SPLIT) * len(all_samples))
    train_samples = all_samples[:split_idx]
    val_samples = all_samples[split_idx:]

    print(f"Train samples: {len(train_samples)}")
    print(f"Val samples:   {len(val_samples)}")

    train_paths = [p for p, _ in train_samples]
    vocab = build_vocab(train_paths, min_freq=1)
    print(f"Vocab size: {len(vocab)}")

    train_dataset = GCodeDataset(train_samples, vocab, MAX_LEN)
    val_dataset = GCodeDataset(val_samples, vocab, MAX_LEN)

    if len(train_dataset) == 0:
        raise ValueError("Training dataset is empty.")
    if len(val_dataset) == 0:
        raise ValueError("Validation dataset is empty.")

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

    model = GCodeCNN(vocab_size=len(vocab), embed_dim=EMBED_DIM).to(DEVICE)

    num_pos = sum(label for _, label in train_samples)
    num_neg = len(train_samples) - num_pos
    pos_weight = torch.tensor([num_neg / max(num_pos, 1)], dtype=torch.float32).to(DEVICE)

    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    optimizer = torch.optim.Adam(model.parameters(), lr=LR)

    best_val_f1 = -1.0

    for epoch in range(1, NUM_EPOCHS + 1):
        train_metrics = run_epoch(model, train_loader, criterion, optimizer)
        val_metrics = run_epoch(model, val_loader, criterion, optimizer=None)

        print(f"\nEpoch {epoch}/{NUM_EPOCHS}")
        print(
            f"Train | loss={train_metrics['loss']:.4f} "
            f"acc={train_metrics['acc']:.4f} "
            f"prec={train_metrics['precision']:.4f} "
            f"rec={train_metrics['recall']:.4f} "
            f"f1={train_metrics['f1']:.4f}"
        )
        print(
            f"Val   | loss={val_metrics['loss']:.4f} "
            f"acc={val_metrics['acc']:.4f} "
            f"prec={val_metrics['precision']:.4f} "
            f"rec={val_metrics['recall']:.4f} "
            f"f1={val_metrics['f1']:.4f}"
        )
        print(
            f"Val Confusion: TP={val_metrics['tp']} TN={val_metrics['tn']} "
            f"FP={val_metrics['fp']} FN={val_metrics['fn']}"
        )

        if val_metrics["f1"] > best_val_f1:
            best_val_f1 = val_metrics["f1"]
            torch.save(
                {
                    "model_state_dict": model.state_dict(),
                    "vocab": vocab,
                    "max_len": MAX_LEN,
                },
                "best_gcode_cnn.pt"
            )
            print("Saved best model to best_gcode_cnn.pt")

if __name__ == "__main__":
    main()