import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Platform } from '@ionic/angular';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

@Component({
  selector: 'idea-barcode-camera-reader',
  templateUrl: 'cameraReader.component.html',
  styleUrls: ['cameraReader.component.scss']
})
export class IDEABarcodeCameraReaderComponent {
  /**
   * The button's fill.
   */
  @Input() fill?: string;
  /**
   * The button's color.
   */
  @Input() color = 'primary';

  /**
   * Whether the barcode reader is currently scanning.
   */
  @Input() isScanning = false;
  @Output() isScanningChange = new EventEmitter<boolean>();
  /**
   * Output the result read by the scanner.
   */
  @Output() scan = new EventEmitter<string>();

  barcodeReaderUIHtml: HTMLDivElement = null;

  _platform = inject(Platform);

  private async canDeviceScanBarcode(): Promise<boolean> {
    return (
      this._platform.is('capacitor') &&
      !!BarcodeScanner &&
      // @todo to fix
      (await (BarcodeScanner as any).checkPermission({ force: true })).granted
    );
  }

  async startScanWithCamera(): Promise<void> {
    if (!(await this.canDeviceScanBarcode())) return;
    if (this.isScanning) return await this.stopScanWithCamera();

    await this.showCameraScannerUI();
    // @todo to fix
    const result = (await BarcodeScanner.startScan()) as any;
    await this.hideCameraScannerUI();

    this.scan.emit(result.content ?? '');
  }
  private async stopScanWithCamera(): Promise<void> {
    await this.hideCameraScannerUI();
    await BarcodeScanner.stopScan();
  }

  private async showCameraScannerUI(): Promise<void> {
    this.isScanning = true;
    this.isScanningChange.emit(this.isScanning);
    this.setBackgroundVisibility(false);

    if (!this.barcodeReaderUIHtml) this.generateScannerUIHtml();

    document.body.appendChild(this.barcodeReaderUIHtml);
  }
  private async hideCameraScannerUI(): Promise<void> {
    this.isScanning = false;
    this.isScanningChange.emit(this.isScanning);
    this.setBackgroundVisibility(true);

    document.getElementById('barcode-reader').remove();
  }

  private setBackgroundVisibility(visible: boolean): void {
    // @todo to fix
    if (visible) (BarcodeScanner as any).showBackground();
    // @todo to fix
    else (BarcodeScanner as any).hideBackground();

    document.body.style.background = visible ? '' : 'transparent';
    document.querySelectorAll('ion-app').forEach((element: HTMLElement | any): void => {
      element.style.opacity = visible ? '1' : '0';
      element.style.background = visible ? '' : 'transparent';
    });
  }
  private generateScannerUIHtml(): void {
    const scanAreaInner = document.createElement('div');
    scanAreaInner.className = 'barcode-scanner-area-inner';

    const scanAreaOuter = document.createElement('div');
    scanAreaOuter.className = 'barcode-scanner-area-outer barcode-surround-cover';
    scanAreaOuter.appendChild(scanAreaInner);

    const scanAreaCover = document.createElement('div');
    scanAreaCover.className = 'barcode-square barcode-surround-cover';
    scanAreaCover.appendChild(scanAreaOuter);

    const scanAreaContainer = document.createElement('div');
    scanAreaContainer.className = 'barcode-scanner-area-container';
    scanAreaContainer.appendChild(scanAreaCover);

    const closeScanButton = document.createElement('ion-button');
    closeScanButton.className = 'barcode-scanner-button';
    closeScanButton.innerText = 'STOP';
    // bind this so method works on document.body
    closeScanButton.onclick = this.stopScanWithCamera.bind(this);

    const scanContainerFlex = document.createElement('div');
    scanContainerFlex.className = 'barcode-container-flex';
    scanContainerFlex.appendChild(scanAreaContainer);
    scanContainerFlex.appendChild(closeScanButton);

    const scanContainer = document.createElement('div');
    scanContainer.className = 'barcode-container';
    scanContainer.id = 'barcode-reader';
    scanContainer.appendChild(scanContainerFlex);

    const style = document.createElement('style');
    style.innerHTML = BARCODE_STYLE;

    this.barcodeReaderUIHtml = scanContainer;
    document.head.appendChild(style);
  }
}

const BARCODE_STYLE = `
  .barcode-container {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1000;
  }
  .barcode-container-flex {
    display: flex;
    height: 100%;
  }
  .barcode-square {
    width: 100%;
    position: relative;
    overflow: hidden;
    transition: 0.3s;
  }
  .barcode-square:after {
    content: '';
    top: 0;
    display: block;
    padding-bottom: 100%;
  }
  .barcode-square > div {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }
  .barcode-surround-cover {
    box-shadow: 0 0 0 99999px rgba(0, 0, 0, 0.5);
  }
  .barcode-scanner-area-container {
    width: 80%;
    max-width: min(500px, 80vh);
    margin: auto;
    align-self: center;
  }
  .barcode-scanner-area-outer {
    display: flex;
    border-radius: 1em;
  }
  .barcode-scanner-area-inner {
    width: 100%;
    margin: 1rem;
    border: 2px solid #fff;
    box-shadow: 0px 0px 2px 1px rgb(0 0 0 / 0.5),
      inset 0px 0px 2px 1px rgb(0 0 0 / 0.5);
    border-radius: 1rem;
  }
  .barcode-scanner-button {
    position: absolute;
    bottom: 0;
    height: auto;
    width: 100%;
    margin: 0;
    --padding-bottom: 30px;
    --padding-top: 30px;
    font-size: 1.2em;
  }
`;
