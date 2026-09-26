import type { AlignmentPoints } from './elementBounds';

export const GUIDE_THRESHOLD_MM = 2;

type VerticalPoint = 'left' | 'centerX' | 'right';
type HorizontalPoint = 'top' | 'centerY' | 'bottom';

export interface AlignmentMatch {
	orientation: 'vertical' | 'horizontal';
	position: number;
	source: VerticalPoint | HorizontalPoint;
	target: VerticalPoint | HorizontalPoint;
	distance: number;
}

interface AlignmentTarget {
	points: AlignmentPoints;
}

interface CanvasAlignmentPoints {
	left: number;
	centerX: number;
	right: number;
	top: number;
	centerY: number;
	bottom: number;
}

export function findAlignmentMatches(
	source: AlignmentPoints,
	targets: AlignmentTarget[],
	canvas: CanvasAlignmentPoints,
): AlignmentMatch[] {
	const matches: AlignmentMatch[] = [];

	const verticalSources: Array<[VerticalPoint, number]> = [
		['left', source.left],
		['centerX', source.centerX],
		['right', source.right],
	];

	const horizontalSources: Array<[HorizontalPoint, number]> = [
		['top', source.top],
		['centerY', source.centerY],
		['bottom', source.bottom],
	];

	const verticalTargets: Array<[VerticalPoint, number]> = [
		['left', canvas.left],
		['centerX', canvas.centerX],
		['right', canvas.right],
	];

	const horizontalTargets: Array<[HorizontalPoint, number]> = [
		['top', canvas.top],
		['centerY', canvas.centerY],
		['bottom', canvas.bottom],
	];

	for (const target of targets) {
		verticalTargets.push(
			['left', target.points.left],
			['centerX', target.points.centerX],
			['right', target.points.right],
		);

		horizontalTargets.push(
			['top', target.points.top],
			['centerY', target.points.centerY],
			['bottom', target.points.bottom],
		);
	}

	const closestVertical = findClosest(verticalSources, verticalTargets);

	const closestHorizontal = findClosest(horizontalSources, horizontalTargets);

	if (closestVertical) {
		matches.push({
			orientation: 'vertical',
			...closestVertical,
		});
	}

	if (closestHorizontal) {
		matches.push({
			orientation: 'horizontal',
			...closestHorizontal,
		});
	}

	return matches;
}

function findClosest<T extends string>(
	sources: Array<[T, number]>,
	targets: Array<[T, number]>,
): {
	position: number;
	source: T;
	target: T;
	distance: number;
} | null {
	let closest: {
		position: number;
		source: T;
		target: T;
		distance: number;
	} | null = null;

	for (const [source, sourcePosition] of sources) {
		for (const [target, targetPosition] of targets) {
			const distance = Math.abs(sourcePosition - targetPosition);

			if (distance > GUIDE_THRESHOLD_MM) {
				continue;
			}

			if (closest && distance >= closest.distance) {
				continue;
			}

			closest = {
				position: targetPosition,
				source,
				target,
				distance,
			};
		}
	}

	return closest;
}
