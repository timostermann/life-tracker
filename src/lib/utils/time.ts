export function formatMinutes(minutes: number | null | undefined): string {
	if (minutes === null || minutes === undefined) return '0m';

	const totalMinutes = Math.max(0, Math.floor(minutes));
	if (totalMinutes === 0) return '0m';

	const hours = Math.floor(totalMinutes / 60);
	const remainingMinutes = totalMinutes % 60;

	if (hours === 0) return `${remainingMinutes}m`;
	if (remainingMinutes === 0) return `${hours}h`;

	return `${hours}h ${remainingMinutes}m`;
}
