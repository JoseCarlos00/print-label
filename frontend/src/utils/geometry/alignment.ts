import type { AlignmentPoints } from './elementBounds';

export const GUIDE_THRESHOLD_MM = 2;

type VerticalPoint = 'left' | 'centerX' | 'right';
type HorizontalPoint = 'top' | 'centerY' | 'bottom';

export interface AlignmentTarget {
	elementId: string;
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

export interface AlignmentMatch {
	orientation: 'vertical' | 'horizontal';
	position: number;
	source: VerticalPoint | HorizontalPoint;
	target: VerticalPoint | HorizontalPoint;
	targetElementId: string | null;
	distance: number;
}

export function findAlignmentMatches(
	source: AlignmentPoints,
	targets: AlignmentTarget[],
	canvas: CanvasAlignmentPoints,
): AlignmentMatch[] {
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

	const verticalTargets: Array<[VerticalPoint, number, string | null]> = [
		['left', canvas.left, null],
		['centerX', canvas.centerX, null],
		['right', canvas.right, null],
	];

	const horizontalTargets: Array<[HorizontalPoint, number, string | null]> = [
		['top', canvas.top, null],
		['centerY', canvas.centerY, null],
		['bottom', canvas.bottom, null],
	];

	for (const target of targets) {
		verticalTargets.push(
			['left', target.points.left, target.elementId],
			['centerX', target.points.centerX, target.elementId],
			['right', target.points.right, target.elementId],
		);

		horizontalTargets.push(
			['top', target.points.top, target.elementId],
			['centerY', target.points.centerY, target.elementId],
			['bottom', target.points.bottom, target.elementId],
		);
	}

	const closestVertical = findClosest(verticalSources, verticalTargets);

	const closestHorizontal = findClosest(horizontalSources, horizontalTargets);

	const matches: AlignmentMatch[] = [];

	if (closestVertical) {
		matches.push({
			orientation: 'vertical',
			source: closestVertical.source,
			target: closestVertical.target,
			position: closestVertical.position,
			targetElementId: closestVertical.targetElementId,
			distance: closestVertical.distance,
		});
	}

	if (closestHorizontal) {
		matches.push({
			orientation: 'horizontal',
			source: closestHorizontal.source,
			target: closestHorizontal.target,
			position: closestHorizontal.position,
			targetElementId: closestHorizontal.targetElementId,
			distance: closestHorizontal.distance,
		});
	}

	return matches;
}

function findClosest<SourcePoint extends string, TargetPoint extends string>(
	sources: Array<[SourcePoint, number]>,
	targets: Array<[TargetPoint, number, string | null]>,
): {
	position: number;
	source: SourcePoint;
	target: TargetPoint;
	targetElementId: string | null;
	distance: number;
} | null {
	let closest: {
		position: number;
		source: SourcePoint;
		target: TargetPoint;
		targetElementId: string | null;
		distance: number;
	} | null = null;

	for (const [source, sourcePosition] of sources) {
		for (const [target, targetPosition, targetElementId] of targets) {
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
				targetElementId,
				distance,
			};
		}
	}

	return closest;
}
