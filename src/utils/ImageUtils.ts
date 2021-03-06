interface IImageUtils {
    getDataURL(image: HTMLImageElement);
}

const ImageUtils = {} as IImageUtils;

let _canvas: HTMLCanvasElement;

ImageUtils.getDataURL = (image) => {
    let canvas;

    if (typeof HTMLCanvasElement === 'undefined') {
        return image.src;

    } else if (image instanceof HTMLCanvasElement) {
        canvas = image;

    } else {
        if (_canvas === undefined) {
            _canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas') as HTMLCanvasElement;
        }

        _canvas.width = image.width;
        _canvas.height = image.height;

        const context = _canvas.getContext('2d');

        if (image instanceof ImageData) {
            context.putImageData(image, 0, 0);

        } else {
            context.drawImage(image, 0, 0, image.width, image.height);
        }

        canvas = _canvas;
    }

    if (canvas.width > 2048 || canvas.height > 2048) {
        return canvas.toDataURL('image/jpeg', 0.6);

    } else {
        return canvas.toDataURL('image/png');
    }
};
