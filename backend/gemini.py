import os
import sys
import json
import re
from PIL import Image
from google import genai

VIEW_NAMES = ["top", "bottom", "front", "back", "left", "right"]

def load_images(renders_dir: str):
    images = []
    for name in VIEW_NAMES:
        path = os.path.join(renders_dir, f"{name}.png")
        if not os.path.exists(path):
            raise FileNotFoundError(f"Missing image: {path}")
        images.append((name, Image.open(path)))
    return images

def extract_json(text: str):
    if not text or not text.strip():
        raise ValueError("Gemini returned empty text.")

    text = text.strip()

    # Remove ```json ... ``` fences if present
    text = re.sub(r"^```json\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^```\s*", "", text)
    text = re.sub(r"\s*```$", "", text)

    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try to extract first JSON object from the text
    match = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if match:
        return json.loads(match.group(0))

    raise ValueError(f"Could not find valid JSON in model response:\n{text}")

def review_stl_views(renders_dir: str):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set.")

    client = genai.Client(api_key=api_key)

    prompt = """
You are reviewing six orthographic renderings of a 3D-printable object.

Classify the object into exactly one category:
- allowed
- restricted_mechanical_part

Return ONLY valid JSON with this schema:
{
  "label": "allowed | restricted_mechanical_part",
  "confidence": 0.0,
  "summary": "brief neutral description",
  "reasons": ["short reason 1", "short reason 2"]
}
"""

    contents = [prompt]

    for view_name, image in load_images(renders_dir):
        contents.append(f"View: {view_name}")
        contents.append(image)

    response = client.models.generate_content(
        model="gemini-3.1-pro-preview",
        contents=contents,
    )

    raw_text = getattr(response, "text", None)

    print("\n=== RAW MODEL RESPONSE ===", file=sys.stderr)
    print(raw_text, file=sys.stderr)
    print("=== END RAW MODEL RESPONSE ===\n", file=sys.stderr)

    return extract_json(raw_text)

if __name__ == "__main__":
    renders_dir = sys.argv[1] if len(sys.argv) > 1 else "renders"
    result = review_stl_views(renders_dir)
    print(json.dumps(result, indent=2))