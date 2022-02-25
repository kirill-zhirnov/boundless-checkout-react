import {BoundlessClient} from 'boundless-api-client';

export function getProductImg(api: BoundlessClient, image: IImagePartial, maxSize: number): IImageData {
	const {width, height, path: imgLocalPath} = image;
	const thumb = api.makeThumb({
		imgLocalPath,
		maxSize
	});

	if (width && height) {
		thumb.setOriginalSize(width, height);

		return thumb.getAttrs();
	}

	return {src: thumb.getSrc()};
}

export interface IImagePartial {
	path: string;
	width?: number | null;
	height?: number | null;
}

export interface IImageData {
	src: string;
	width?: number;
	height?: number;
	blurSrc?: string;
}