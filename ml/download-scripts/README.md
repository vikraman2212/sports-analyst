# Model Download Scripts

This directory contains download scripts for the shortlisted pretrained cricket ball detection models from T3A survey.

## Quick Start

### Prerequisites

```bash
# Install Python dependencies
pip install roboflow ultralytics

# Get your Roboflow API key from:
# https://app.roboflow.com/settings/api
export ROBOFLOW_API_KEY="your_key_here"
```

---

## Model #1: Roboflow Cricket Ball Tracking (PRIMARY)

**Recommended for benchmarking and production.**

### Download

```bash
# Using Python script
python download_roboflow_cricket_ball.py --api-key YOUR_KEY --output-dir ./data/cricket-ball-tracking

# Or with environment variable
export ROBOFLOW_API_KEY="your_key_here"
python download_roboflow_cricket_ball.py
```

### Details
- **Images:** 7,452
- **License:** CC BY 4.0 (free for evaluation and commercial use with attribution)
- **Format:** YOLOv8 native (.pt)
- **Size:** ~450 MB
- **Priority:** ⭐⭐⭐ HIGH

---

## Model #2: Akel Varghese Cricket Ball Prediction (BASELINE)

**Smaller dataset for quick benchmarking.**

### Download

```bash
# Download dataset
python download_akel_varghese.py --api-key YOUR_KEY --output-dir ./data/akel-varghese

# Or use API inference (no download)
python download_akel_varghese.py --show-api-example
```

### Details
- **Images:** 844
- **License:** CC BY 4.0
- **Format:** YOLOv8 native (.pt)
- **Size:** ~130 MB
- **Priority:** ⭐⭐ MEDIUM

---

## Model #3: GTS AI Cricket Ball Detection (ALTERNATIVE)

**High-quality dataset requiring training. No pretrained model.**

### Download

```bash
# Run interactive download script
./download_gts_ai.sh ./data/gts-ai-cricket-ball
```

**Note:** This requires manual registration and download from the GTS AI website. The script will guide you through the process.

### Training Required

After downloading, train the model:

```bash
# Train YOLOv8n (nano - fastest)
yolo train data=./data/gts-ai-cricket-ball/data.yaml model=yolov8n.pt epochs=100 imgsz=640

# Train YOLO11n (latest - best for small objects)
yolo train data=./data/gts-ai-cricket-ball/data.yaml model=yolo11n.pt epochs=100 imgsz=640
```

### Details
- **Images:** 1,778 annotated
- **License:** Custom (evaluation allowed, commercial requires license)
- **Format:** YOLO annotations (requires training)
- **Size:** ~280 MB
- **Training Time:** 2-4 hours on GPU
- **Priority:** ⭐⭐ MEDIUM

---

## Export to ONNX for Browser Deployment

After downloading or training a model, export to ONNX for browser inference:

```bash
# Export YOLOv8 model
yolo export model=path/to/best.pt format=onnx dynamic=True opset=17

# Or using Python
from ultralytics import YOLO
model = YOLO('path/to/best.pt')
model.export(format='onnx', dynamic=True, opset=17)
```

The exported `.onnx` file can be used with `onnxruntime-web` in the browser.

---

## Verification

After downloading, verify the dataset structure:

```bash
# Check dataset structure
tree ./data/cricket-ball-tracking -L 2

# Expected structure:
# ./data/cricket-ball-tracking/
# ├── train/
# │   ├── images/
# │   └── labels/
# ├── valid/
# │   ├── images/
# │   └── labels/
# ├── test/
# │   ├── images/
# │   └── labels/
# └── data.yaml
```

---

## Troubleshooting

### "roboflow package not installed"
```bash
pip install roboflow
```

### "API key required"
1. Sign up at https://roboflow.com (free tier available)
2. Get your API key from https://app.roboflow.com/settings/api
3. Set environment variable: `export ROBOFLOW_API_KEY="your_key"`

### "Download failed"
- Check internet connection
- Verify API key is valid
- Try using Roboflow web interface as alternative

### GTS AI download issues
- Manual download required from https://gts.ai/dataset-download/cricket-ball-detection-dataset/
- Fill registration form to get download link
- Place ZIP in output directory and re-run script

---

## Next Steps

See `T3A_model_survey.md` for:
- Detailed model evaluation criteria
- Performance benchmarking plan (T3B)
- Training recommendations (T3C, T3D)
- YOLO11 vs YOLOv8 comparison

---

## License Information

- **Model #1 & #2:** CC BY 4.0 (free for commercial use with attribution)
- **Model #3:** Custom license (evaluation allowed, commercial requires purchase)
- **YOLOv8/YOLO11:** AGPLv3 (open source, commercial license available from Ultralytics)

For production deployment, review licensing requirements in `T3A_model_survey.md`.
