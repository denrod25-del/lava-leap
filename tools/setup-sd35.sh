#!/usr/bin/env bash
#
# setup-sd35.sh — Install ComfyUI and download Stable Diffusion 3.5 weights.
#
# This helper installs ComfyUI into ./ComfyUI and downloads a chosen SD 3.5
# checkpoint plus the three shared text encoders. See
# docs/stable-diffusion-local-setup.md for the full walkthrough.
#
# Requirements: git, python3 (3.12 recommended), and a Hugging Face account that
# has accepted the SD 3.5 model license. You'll be prompted for a read token.
#
# Usage:
#   ./tools/setup-sd35.sh [medium|large|turbo] [--accel cuda|cpu|mac]
#
# Examples:
#   ./tools/setup-sd35.sh medium --accel cuda
#   ./tools/setup-sd35.sh large  --accel mac
#
set -euo pipefail

MODEL="${1:-medium}"
ACCEL="cuda"
# crude flag parse: look for --accel <value>
for ((i = 1; i <= $#; i++)); do
  if [[ "${!i}" == "--accel" ]]; then
    j=$((i + 1))
    ACCEL="${!j:-cuda}"
  fi
done

case "$MODEL" in
  medium) REPO="stabilityai/stable-diffusion-3.5-medium"; CKPT="sd3.5_medium.safetensors" ;;
  large)  REPO="stabilityai/stable-diffusion-3.5-large";  CKPT="sd3.5_large.safetensors" ;;
  turbo)  REPO="stabilityai/stable-diffusion-3.5-large-turbo"; CKPT="sd3.5_large_turbo.safetensors" ;;
  *) echo "Unknown model '$MODEL' (use: medium | large | turbo)" >&2; exit 1 ;;
esac

echo ">> Model:        $MODEL ($REPO)"
echo ">> Checkpoint:   $CKPT"
echo ">> Acceleration: $ACCEL"
echo

command -v git >/dev/null    || { echo "git is required" >&2; exit 1; }
command -v python3 >/dev/null || { echo "python3 is required" >&2; exit 1; }

# 1. Clone ComfyUI
if [[ ! -d ComfyUI ]]; then
  echo ">> Cloning ComfyUI..."
  git clone https://github.com/comfyanonymous/ComfyUI
else
  echo ">> ComfyUI already present, skipping clone."
fi
cd ComfyUI

# 2. Virtual env + deps
if [[ ! -d venv ]]; then
  python3 -m venv venv
fi
# shellcheck disable=SC1091
source venv/bin/activate

echo ">> Installing PyTorch ($ACCEL)..."
case "$ACCEL" in
  cuda) pip install --quiet torch torchvision --index-url https://download.pytorch.org/whl/cu124 ;;
  cpu|mac) pip install --quiet torch torchvision ;;
  *) echo "Unknown --accel '$ACCEL' (use: cuda | cpu | mac)" >&2; exit 1 ;;
esac

echo ">> Installing ComfyUI requirements..."
pip install --quiet -r requirements.txt
pip install --quiet -U "huggingface_hub[cli]"

# 3. Authenticate with Hugging Face (needed for gated weights)
if ! huggingface-cli whoami >/dev/null 2>&1; then
  echo ">> Log in to Hugging Face (create a read token at"
  echo "   https://huggingface.co/settings/tokens and make sure you've accepted"
  echo "   the model license at https://huggingface.co/$REPO )"
  huggingface-cli login
fi

# 4. Download checkpoint + shared text encoders
echo ">> Downloading checkpoint..."
huggingface-cli download "$REPO" "$CKPT" \
  --local-dir models/checkpoints

echo ">> Downloading text encoders..."
huggingface-cli download stabilityai/stable-diffusion-3.5-large \
  text_encoders/clip_l.safetensors \
  text_encoders/clip_g.safetensors \
  text_encoders/t5xxl_fp16.safetensors \
  --local-dir models

echo
echo ">> Done. Start ComfyUI with:"
echo "     cd ComfyUI && source venv/bin/activate && python main.py"
echo "   Then open http://127.0.0.1:8188 and load an SD3 example workflow:"
echo "     https://comfyanonymous.github.io/ComfyUI_examples/sd3/"
