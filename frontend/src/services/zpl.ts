import { generateZpl } from 'shared/zpl';


// const zpl = generateZpl(html);

// const image = await renderZpl(zpl);

// preview.src = image;

export async function renderZpl(zpl) {
	const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: zpl,
	});

	if (!response.ok) {
		throw new Error(await response.text());
	}

	const blob = await response.blob();

	return URL.createObjectURL(blob);
}


// previewButton.addEventListener('click', async () => {
// 	const zpl = generateZpl();

// 	previewImage.src = await renderZpl(zpl);
// });
