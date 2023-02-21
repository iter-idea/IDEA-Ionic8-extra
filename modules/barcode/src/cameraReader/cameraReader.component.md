# IDEABarcodeCameraReaderComponent

## Selector

idea-barcode-camera-reader

## Inputs

- `fill` (*string*) - The button's fill.
- `color` (*string*) - The button's color.
- `isScanning` (*boolean*) - Whether the barcode reader is currently scanning.

## Outputs

- `isScanningChange` (*EventEmitter<boolean>*) 
- `scan` (*EventEmitter<string>*) - Output the result read by the scanner.
