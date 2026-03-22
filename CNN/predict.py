import sys
import torch
from train_gcode_cnn import GCodeCNN, tokenize_gcode_file, encode_tokens, DEVICE

def main():
    if len(sys.argv) < 2:
        print("Usage: python predict_gcode.py path/to/file.gcode")
        return

    model_path = "best_gcode_cnn.pt"
    gcode_path = sys.argv[1]

    checkpoint = torch.load(model_path, map_location=DEVICE)
    vocab = checkpoint["vocab"]
    max_len = checkpoint["max_len"]

    model = GCodeCNN(vocab_size=len(vocab)).to(DEVICE)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    tokens = tokenize_gcode_file(gcode_path)
    ids = encode_tokens(tokens, vocab, max_len)

    x = torch.tensor([ids], dtype=torch.long).to(DEVICE)

    with torch.no_grad():
        logits = model(x)
        prob = torch.sigmoid(logits).item()

    print(f"Gun probability: {prob:.4f}")
    print("Prediction:", "gun" if prob >= 0.5 else "non_gun")

if __name__ == "__main__":
    main()  