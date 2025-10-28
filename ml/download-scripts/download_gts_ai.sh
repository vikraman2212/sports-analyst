#!/bin/bash
# Download Script for GTS AI Cricket Ball Detection Dataset
# Model #3 - Alternative Candidate (Training Required)
#
# Usage:
#   ./download_gts_ai.sh [output_directory]
#
# Note: This dataset requires manual download from the website.
#       This script provides instructions and verification.

set -e

OUTPUT_DIR="${1:-./data/gts-ai-cricket-ball}"
DATASET_URL="https://gts.ai/dataset-download/cricket-ball-detection-dataset/"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  GTS AI Cricket Ball Detection Dataset Download"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Dataset Information:"
echo "   - Images: 1,778 annotated"
echo "   - License: Custom (evaluation allowed, commercial requires license)"
echo "   - Format: YOLO annotation format"
echo "   - Quality: High (diverse lighting, backgrounds, ball states)"
echo ""
echo "⚠️  MANUAL DOWNLOAD REQUIRED"
echo ""
echo "This dataset requires manual registration and download."
echo "Please follow these steps:"
echo ""
echo "1️⃣  Visit: ${DATASET_URL}"
echo "2️⃣  Fill out the registration form"
echo "3️⃣  Download the ZIP file"
echo "4️⃣  Move the ZIP to: ${OUTPUT_DIR}/"
echo "5️⃣  Run this script again to extract and verify"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create output directory
mkdir -p "${OUTPUT_DIR}"

# Check if ZIP file exists
ZIP_FILE=$(find "${OUTPUT_DIR}" -name "*.zip" -type f | head -n 1)

if [ -z "$ZIP_FILE" ]; then
    echo ""
    echo "❌ No ZIP file found in ${OUTPUT_DIR}"
    echo ""
    echo "📥 Opening download page in browser..."
    
    # Try to open browser (cross-platform)
    if command -v xdg-open &> /dev/null; then
        xdg-open "${DATASET_URL}" 2>/dev/null || true
    elif command -v open &> /dev/null; then
        open "${DATASET_URL}" 2>/dev/null || true
    else
        echo "   Please manually visit: ${DATASET_URL}"
    fi
    
    echo ""
    echo "After downloading, place the ZIP in: ${OUTPUT_DIR}"
    echo "Then run this script again."
    exit 1
fi

echo ""
echo "✅ Found ZIP file: $(basename "$ZIP_FILE")"
echo ""
echo "🔄 Extracting dataset..."

# Extract ZIP
cd "${OUTPUT_DIR}"
unzip -q "$(basename "$ZIP_FILE")" || {
    echo "❌ Extraction failed"
    exit 1
}

echo "✅ Extraction complete"
echo ""

# Verify dataset structure
echo "🔍 Verifying dataset structure..."

EXPECTED_FILES=("train" "valid" "test" "data.yaml")
MISSING_FILES=()

for file in "${EXPECTED_FILES[@]}"; do
    if [ ! -e "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
    echo "✅ Dataset structure verified"
    echo ""
    echo "📊 Dataset Contents:"
    
    if [ -d "train" ]; then
        TRAIN_COUNT=$(find train -name "*.jpg" -o -name "*.png" | wc -l)
        echo "   - train/  : ${TRAIN_COUNT} images"
    fi
    
    if [ -d "valid" ]; then
        VALID_COUNT=$(find valid -name "*.jpg" -o -name "*.png" | wc -l)
        echo "   - valid/  : ${VALID_COUNT} images"
    fi
    
    if [ -d "test" ]; then
        TEST_COUNT=$(find test -name "*.jpg" -o -name "*.png" | wc -l)
        echo "   - test/   : ${TEST_COUNT} images"
    fi
    
    if [ -f "data.yaml" ]; then
        echo "   - data.yaml : YOLO config ✓"
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  NEXT STEPS: Training Required"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "This dataset does not include pretrained weights."
    echo "You need to train a model using the provided annotations."
    echo ""
    echo "📝 Training Commands:"
    echo ""
    echo "# Install Ultralytics"
    echo "pip install ultralytics"
    echo ""
    echo "# Train YOLOv8n (nano - fastest)"
    echo "yolo train data=$(pwd)/data.yaml model=yolov8n.pt epochs=100 imgsz=640 batch=16"
    echo ""
    echo "# Train YOLOv8s (small - better accuracy)"
    echo "yolo train data=$(pwd)/data.yaml model=yolov8s.pt epochs=100 imgsz=640 batch=16"
    echo ""
    echo "# Train YOLO11n (latest - best for small objects)"
    echo "yolo train data=$(pwd)/data.yaml model=yolo11n.pt epochs=100 imgsz=640 batch=16"
    echo ""
    echo "⏱️  Estimated training time: 2-4 hours (on GPU)"
    echo ""
    echo "📊 After training, your model will be saved to:"
    echo "   runs/detect/train/weights/best.pt"
    echo ""
    echo "🔄 Export to ONNX for browser deployment:"
    echo "   yolo export model=runs/detect/train/weights/best.pt format=onnx dynamic=True opset=17"
    echo ""
else
    echo "⚠️  Warning: Some expected files missing:"
    for file in "${MISSING_FILES[@]}"; do
        echo "   - $file"
    done
    echo ""
    echo "Please verify the extracted contents match YOLO format:"
    ls -la
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
