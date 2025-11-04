# JSON Export Module

Export cricket ball delivery analysis results to JSON format for sharing, archiving, and analysis.

## Features

- ✅ **Export to JSON**: Convert `DeliveryResult` to structured JSON format
- ✅ **Download**: Save results as `.json` file
- ✅ **Copy to Clipboard**: Quick copy for sharing
- ✅ **Web Share API**: Native sharing on mobile devices
- ✅ **Import**: Load previously exported results
- ✅ **Format Validation**: Ensure data integrity

## Usage

### Basic Export

```typescript
import { exportDeliveryToJSON, deliveryToJSONString } from '@/lib/export/jsonExport';
import type { DeliveryResult, CalibrationProfile } from '@/lib/types';

const result: DeliveryResult = {
  speedKmh: 135.5,
  confidence: 0.92,
  detectionCount: 18,
  trajectoryPoints: [...],
  processingMs: 842,
  warnings: ['Low lighting detected']
};

const calibration: CalibrationProfile = {
  pitchLengthPixels: 512,
  referenceDistanceMeters: 20.12,
  homographyMatrix: null
};

// Export to object
const exportedData = exportDeliveryToJSON(result, calibration);

// Export to JSON string
const jsonString = deliveryToJSONString(result, calibration);
```

### Download as File

```typescript
import { downloadDeliveryJSON } from "@/lib/export/jsonExport";

// Auto-generated filename
downloadDeliveryJSON(result, calibration);

// Custom filename
downloadDeliveryJSON(result, calibration, "my-delivery.json");
```

### Copy to Clipboard

```typescript
import { copyDeliveryJSON, isClipboardSupported } from "@/lib/export/jsonExport";

if (isClipboardSupported()) {
  await copyDeliveryJSON(result, calibration);
  console.log("Copied to clipboard!");
}
```

### Share (Mobile)

```typescript
import { shareDeliveryJSON, isShareSupported } from "@/lib/export/jsonExport";

if (isShareSupported()) {
  try {
    await shareDeliveryJSON(result, calibration);
    console.log("Shared successfully!");
  } catch (error) {
    console.log("User cancelled share");
  }
}
```

### Import from JSON

```typescript
import { importDeliveryFromJSON } from "@/lib/export/jsonExport";

const jsonString = '{ "metadata": {...}, "delivery": {...} }';

try {
  const imported = importDeliveryFromJSON(jsonString);
  console.log("Speed:", imported.delivery.speedKmh, "km/h");
} catch (error) {
  console.error("Invalid JSON format:", error.message);
}
```

## Export Format

```json
{
  "metadata": {
    "exportedAt": "2025-10-06T12:34:56.789Z",
    "version": "1.0.0",
    "appName": "Cricket Ball Speed Tracker"
  },
  "delivery": {
    "speedKmh": 135.5,
    "confidence": 0.92,
    "detectionCount": 18,
    "processingMs": 842,
    "warnings": ["Low lighting detected"]
  },
  "trajectory": {
    "totalPoints": 18,
    "durationMs": 1500,
    "points": [
      {
        "timestampMs": 0,
        "pixelX": 100,
        "pixelY": 200,
        "estimatedZ": null
      }
    ]
  },
  "calibration": {
    "pitchLengthPixels": 512,
    "referenceDistanceMeters": 20.12,
    "hasHomography": false
  },
  "statistics": {
    "avgConfidence": 0.92,
    "trajectoryDuration": 1500,
    "estimatedDistancePixels": 450.5
  }
}
```

## Browser Compatibility

| Feature         | Chrome | Firefox | Safari   | Edge |
| --------------- | ------ | ------- | -------- | ---- |
| Export/Download | ✅     | ✅      | ✅       | ✅   |
| Clipboard API   | ✅     | ✅      | ✅       | ✅   |
| Web Share API   | ✅     | ❌      | ✅ (iOS) | ✅   |

## Error Handling

```typescript
import { importDeliveryFromJSON } from "@/lib/export/jsonExport";

try {
  const imported = importDeliveryFromJSON(jsonString);
} catch (error) {
  if (error.message.includes("Invalid JSON format")) {
    // Handle malformed JSON
  } else if (error.message.includes("missing required fields")) {
    // Handle incomplete data
  } else if (error.message.includes("speedKmh must be a number")) {
    // Handle type validation error
  }
}
```

## Future Enhancements

- [ ] Batch export (multiple deliveries)
- [ ] CSV export format
- [ ] Cloud storage integration
- [ ] Session history management
- [ ] Export templates/presets
