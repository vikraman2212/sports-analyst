#!/usr/bin/env python3
"""
Download Script for Akel Varghese Cricket Ball Prediction Model
Model #2 - Baseline Candidate

Usage:
    python download_akel_varghese.py [--api-key YOUR_KEY] [--output-dir ./data]

Requirements:
    pip install roboflow
"""

import argparse
import os
import sys
from pathlib import Path


def download_akel_varghese_model(api_key: str, output_dir: str = "./data/akel-varghese"):
    """
    Download the Akel Varghese Cricket Ball Prediction model.
    
    Args:
        api_key: Roboflow API key
        output_dir: Directory to save the dataset/model
    """
    try:
        from roboflow import Roboflow
    except ImportError:
        print("❌ Error: roboflow package not installed")
        print("Install with: pip install roboflow")
        sys.exit(1)
    
    print("🔄 Initializing Roboflow client...")
    rf = Roboflow(api_key=api_key)
    
    print("🔄 Accessing Akel Varghese cricket ball prediction project...")
    project = rf.workspace("akel-varghese").project("cricket-ball-prediction")
    
    print("🔄 Downloading dataset (version 1, YOLOv8 format)...")
    print(f"   Output directory: {output_dir}")
    
    # Download in YOLOv8 format
    dataset = project.version(1).download("yolov8", location=output_dir)
    
    print(f"✅ Download complete!")
    print(f"   Dataset location: {output_dir}")
    print(f"\n📊 Dataset info:")
    print(f"   - Total images: 844")
    print(f"   - License: CC BY 4.0")
    print(f"   - Classes: cricket-ball")
    
    # Verify download
    data_yaml = Path(output_dir) / "data.yaml"
    if data_yaml.exists():
        print(f"\n✅ Verification: data.yaml found")
        print(f"\n📝 Next steps:")
        print(f"   1. Train or fine-tune:")
        print(f"      yolo train data={data_yaml} model=yolov8n.pt epochs=50 imgsz=640")
        print(f"   2. Or use for API inference (see alternative_api_inference.py)")
    else:
        print(f"\n⚠️  Warning: data.yaml not found in {output_dir}")
    
    return dataset


def show_api_inference_example():
    """Show example of using Roboflow API for inference without download."""
    example_code = '''
# Alternative: Use Roboflow API for inference (no download needed)
import requests
from PIL import Image

# Your API key
API_KEY = "your_api_key_here"

# Load image
image_path = "path/to/your/image.jpg"

# Make prediction request
with open(image_path, "rb") as f:
    response = requests.post(
        "https://detect.roboflow.com/cricket-ball-prediction/1",
        files={"file": f},
        headers={"api_key": API_KEY}
    )

predictions = response.json()
print(predictions)
'''
    print("\n" + "="*60)
    print("API INFERENCE ALTERNATIVE (No Download):")
    print("="*60)
    print(example_code)


def main():
    parser = argparse.ArgumentParser(
        description="Download Akel Varghese Cricket Ball Prediction Model"
    )
    parser.add_argument(
        "--api-key",
        type=str,
        help="Roboflow API key (or set ROBOFLOW_API_KEY env var)",
        default=os.environ.get("ROBOFLOW_API_KEY")
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="./data/akel-varghese",
        help="Output directory for dataset"
    )
    parser.add_argument(
        "--show-api-example",
        action="store_true",
        help="Show API inference example instead of downloading"
    )
    
    args = parser.parse_args()
    
    if args.show_api_example:
        show_api_inference_example()
        return
    
    if not args.api_key:
        print("❌ Error: API key required")
        print("   Option 1: Pass --api-key YOUR_KEY")
        print("   Option 2: Set ROBOFLOW_API_KEY environment variable")
        print("\n   Get your API key from: https://app.roboflow.com/settings/api")
        print("\n   Or use --show-api-example to see API inference option")
        sys.exit(1)
    
    try:
        download_akel_varghese_model(args.api_key, args.output_dir)
    except Exception as e:
        print(f"❌ Download failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
