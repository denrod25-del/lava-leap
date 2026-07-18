# Running Stable Diffusion 3.5 Locally

A practical guide to generating images with **Stable Diffusion 3.5** on your own
machine using [ComfyUI](https://github.com/comfyanonymous/ComfyUI) — the officially
supported UI for SD 3.5.

> A companion helper script lives at [`tools/setup-sd35.sh`](../tools/setup-sd35.sh).
> It installs ComfyUI and downloads the model files for you. Read the steps below
> first so you understand what it does.

---

## 1. Check your hardware

SD 3.5 ships in three sizes. Pick one based on your GPU VRAM:

| Model                    | Params | Min VRAM                 | Best for                       |
| ------------------------ | ------ | ------------------------ | ------------------------------ |
| **3.5 Large**            | 8B     | 16–24 GB (~9 GB w/ FP8)  | Maximum quality                |
| **3.5 Large Turbo**      | 8B     | 16–24 GB                 | 4-step fast generation         |
| **3.5 Medium**           | 2.5B   | ~9.9 GB                  | Consumer GPUs (RTX 3060/4060)  |

- **NVIDIA GPU** — smoothest experience (CUDA).
- **Apple Silicon (M1–M4)** — works via Metal; use Medium, expect ~1–3 min/image.
- **AMD** — Linux (ROCm) or Windows (ZLUDA/DirectML); more setup friction.
- **No/weak GPU** — runs on CPU but very slowly. Use Medium and be patient.

## 2. Accept the license & get a Hugging Face token

The SD 3.5 weights are gated. Before you can download them:

1. Log into Hugging Face and open the model page(s) you want, then click
   **"Agree and access repository"**:
   - Medium: https://huggingface.co/stabilityai/stable-diffusion-3.5-medium
   - Large:  https://huggingface.co/stabilityai/stable-diffusion-3.5-large
   - Large Turbo: https://huggingface.co/stabilityai/stable-diffusion-3.5-large-turbo
2. Create a **read** token at https://huggingface.co/settings/tokens

## 3. Install ComfyUI

**Easiest:** the Desktop app (Windows/Mac) from https://www.comfy.org

**Manual (Python 3.12 + git):**

```bash
git clone https://github.com/comfyanonymous/ComfyUI
cd ComfyUI
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
# NVIDIA (CUDA 12.4):
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124
# Apple Silicon / CPU: pip install torch torchvision
pip install -r requirements.txt
```

## 4. Download the model files

You need the **checkpoint** plus **three shared text encoders**. Layout:

```
ComfyUI/
└─ models/
   ├─ checkpoints/
   │   └─ sd3.5_medium.safetensors        # or sd3.5_large / sd3.5_large_turbo
   └─ text_encoders/
       ├─ clip_l.safetensors
       ├─ clip_g.safetensors
       └─ t5xxl_fp16.safetensors          # use t5xxl_fp8_e4m3fn to save VRAM
```

Download via CLI:

```bash
pip install -U "huggingface_hub[cli]"
huggingface-cli login              # paste your read token

# Checkpoint (Medium shown; swap repo/filename for Large or Turbo)
huggingface-cli download stabilityai/stable-diffusion-3.5-medium \
  sd3.5_medium.safetensors \
  --local-dir ComfyUI/models/checkpoints

# Text encoders (shared across all SD 3.5 sizes)
huggingface-cli download stabilityai/stable-diffusion-3.5-large \
  text_encoders/clip_l.safetensors \
  text_encoders/clip_g.safetensors \
  text_encoders/t5xxl_fp16.safetensors \
  --local-dir ComfyUI/models
```

Download pages if you'd rather click:
- Checkpoints: https://huggingface.co/stabilityai/stable-diffusion-3.5-medium/tree/main
- Encoders: https://huggingface.co/stabilityai/stable-diffusion-3.5-large/tree/main/text_encoders
- Comfy-packaged FP8 bundle: https://huggingface.co/Comfy-Org/stable-diffusion-3.5-fp8

## 5. Run it

```bash
python main.py                     # then open http://127.0.0.1:8188
```

- Load an **official example workflow**: https://comfyanonymous.github.io/ComfyUI_examples/sd3/
  — drag the example PNG onto the canvas and the full node graph loads.
- Select your checkpoint + the three encoders in the loader nodes, type a prompt, **Queue**.

### Sampler settings

| Model         | Steps  | CFG   |
| ------------- | ------ | ----- |
| Turbo         | ~4     | ~1.0  |
| Medium / Large| 28–40  | 4–5   |

## Troubleshooting

- **Out of VRAM** — switch `t5xxl_fp16` → `t5xxl_fp8_e4m3fn`, use the FP8 checkpoint,
  or drop to Medium. ComfyUI auto-offloads to system RAM when needed.
- **Mac** — Metal is auto-detected; no CUDA flags needed.
- **Prefer a simpler UI** — [Automatic1111](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
  and [SwarmUI](https://github.com/mcmonkeyprojects/SwarmUI) also support SD 3.5.

---

*This document is a local-tooling reference and is unrelated to the Lava Leap game runtime.*
