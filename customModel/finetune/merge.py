from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import torch

base = "LiquidAI/LFM2.5-1.2B-Base"
adapter = "F:\discordFineTune2026\checkpoint-7866\checkpoint-7866"
out_dir = "F:/discordFineTune2026/lfm25-merged-fourth"

model = AutoModelForCausalLM.from_pretrained(
    base,
    torch_dtype=torch.float16,
    device_map="cpu",
)
model = PeftModel.from_pretrained(model, adapter, device_map="cpu")
model = model.merge_and_unload()
model.save_pretrained(out_dir, safe_serialization=True)

tok = AutoTokenizer.from_pretrained(base)
tok.save_pretrained(out_dir)

print("Merged model saved to:", out_dir)