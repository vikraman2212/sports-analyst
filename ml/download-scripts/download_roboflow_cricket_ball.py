#!/usr/bin/env python3
"""
Download Script for Roboflow Cricket Ball Tracking Dataset
Model #1 - Primary Candidate

Usage:
    python download_roboflow_cricket_ball.py [--api-key YOUR_KEY] [--output-dir ./data]

Requirements:
    pip install roboflow
"""

import argparse
import os
import sys
from pathlib import Path


def download_cricket_ball_dataset(api_key: str, output_dir: str = "./data/cricket-ball-tracking"):
    """
    Download the Roboflow Cricket Ball Tracking Dataset.
    
    Args:
        api_key: Roboflow API key (get from https://app.roboflow.com/settings/api)
        output_dir: Directory to save the dataset
    """
    # Validate API key format (basic validation)
    if not api_key or len(api_key) < 10 or not api_key.replace('-', '').replace('_', '').isalnum():
        print("❌ Error: Invalid API key format")
        print("   API key should be alphanumeric (with optional hyphens/underscores)")
        sys.exit(1)
    
    try:
        from roboflow import Roboflow
    except ImportError:
        print("❌ Error: roboflow package not installed")
        print("Install with: pip install roboflow")
        sys.exit(1)
    
    print("🔄 Initializing Roboflow client...")
    rf = Roboflow(api_key=api_key)
    
    print("🔄 Accessing cricket ball tracking dataset...")
    project = rf.workspace("cricket-ball-tracking-dataset").project("cricket-dataset-z2wkt")
    
    print("🔄 Downloading dataset (version 1, YOLOv8 format)...")
    print(f"   Output directory: {output_dir}")
    
    # Download in YOLOv8 format
    dataset = project.version(1).download("yolov8", location=output_dir)
    
    print(f"✅ Download complete!")
    print(f"   Dataset location: {output_dir}")
    print(f"\n📊 Dataset structure:")
    print(f"   - train/ : Training images and labels")
    print(f"   - valid/ : Validation images and labels")
    print(f"   - test/  : Test images and labels")
    print(f"   - data.yaml : YOLO configuration file")
    
    # Verify download
    data_yaml = Path(output_dir) / "data.yaml"
    if data_yaml.exists():
        print(f"\n✅ Verification: data.yaml found")
        print(f"\n📝 Next steps:")
        print(f"   1. Train model:")
        print(f"      yolo train data={data_yaml} model=yolov8n.pt epochs=100 imgsz=640")
        print(f"   2. Or use pretrained weights from Roboflow")
    else:
        print(f"\n⚠️  Warning: data.yaml not found in {output_dir}")
    
    return dataset


def main():
    parser = argparse.ArgumentParser(
        description="Download Roboflow Cricket Ball Tracking Dataset"
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
        default="./data/cricket-ball-tracking",
        help="Output directory for dataset"
    )
    
    args = parser.parse_args()
    
    if not args.api_key:
        print("❌ Error: API key required")
        print("   Option 1: Pass --api-key YOUR_KEY")
        print("   Option 2: Set ROBOFLOW_API_KEY environment variable")
        print("\n   Get your API key from: https://app.roboflow.com/settings/api")
        sys.exit(1)
    
    try:
        download_cricket_ball_dataset(args.api_key, args.output_dir)
    except Exception as e:
        print(f"❌ Download failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
