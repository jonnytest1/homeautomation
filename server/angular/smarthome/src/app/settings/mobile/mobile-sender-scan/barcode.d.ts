



declare global {
    const BarcodeDetector: BarcodeDetector


}

export interface BarcodeDetector {
    getSupportedFormats: () => any
    new(args: any)

    detect: (arg) => any
}