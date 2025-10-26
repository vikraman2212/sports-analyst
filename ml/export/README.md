# ML Export Directory

This directory will contain exported ONNX models for browser deployment.

## Expected Files

- `model.onnx` - Trained ball detection model exported from fast.ai
- Model metadata (optional)

## Export Process (Placeholder)

```bash
# After training is complete:
python ml/training/export_to_onnx.py --weights runs/best.pth --out ml/export/model.onnx

# Copy to frontend public directory for deployment:
cp ml/export/model.onnx frontend/public/model.onnx
```

## Model Requirements

- Size: <50MB (per constitution)
- Format: ONNX 1.12+
- Input: RGB image tensor (configurable dimensions)
- Output: Bounding box predictions with confidence scores
