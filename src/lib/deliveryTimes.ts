// Helper functions for dynamic delivery times
export const getVancouverDateTime = () => {
	const now = new Date();
	const options: Intl.DateTimeFormatOptions = {
		timeZone: "America/Vancouver",
		hour: "numeric", // Get hour in numeric format (e.g., "14")
		minute: "numeric", // Get minute in numeric format (e.g., "30")
		weekday: "long", // Get the full name of the weekday (e.g., "Monday")
		year: "numeric",
		month: "numeric",
		day: "numeric",
		hour12: false, // Use 24-hour format for the hour
	};
	const formatter = new Intl.DateTimeFormat("en-CA", options);
	const parts = formatter.formatToParts(now);

	let hourVancouver = 0;
	let minuteVancouver = 0;
	let weekdayName = "";
	let year = 0;
	let month = 0;
	let day = 0;

	for (const part of parts) {
		switch (part.type) {
			case "hour":
				// The hour might be '24' for midnight in some locales with hourCycle h24, map to 0.
				// For hourCycle h23 (default for en-CA numeric), it's 0-23.
				const hr = parseInt(part.value);
				hourVancouver = hr === 24 ? 0 : hr;
				break;
			case "minute":
				minuteVancouver = parseInt(part.value);
				break;
			case "weekday":
				weekdayName = part.value;
				break;
			case "year":
				year = parseInt(part.value);
				break;
			case "month":
				month = parseInt(part.value);
				break;
			case "day":
				day = parseInt(part.value);
				break;
		}
	}

	const dayMap: { [key: string]: number } = {
		Sunday: 0,
		Monday: 1,
		Tuesday: 2,
		Wednesday: 3,
		Thursday: 4,
		Friday: 5,
		Saturday: 6,
	};
	const dayOfWeek = dayMap[weekdayName];

	return { dayOfWeek, hourVancouver, minuteVancouver, year, month, day };
};

export const shouldIncludeDeliveryTime = (time: 'ASAP' | '8pm - 8:30pm' | '9pm - 9:30pm' | '5pm - 5:30pm'): string => {
	const { dayOfWeek, hourVancouver, minuteVancouver, year, month, day } = getVancouverDateTime();
	const currentTimeInMinutes = hourVancouver * 60 + minuteVancouver;

	// Special Schedule for Dec 22, 2025 (Closed after 5:30pm)
	if (year === 2025 && month === 12 && day === 22) {
		const startTime = 9 * 60; // 9:00 AM
		const endTime = 17 * 60 + 30; // 5:30 PM
		
		if (time === 'ASAP') {
			if (currentTimeInMinutes >= startTime && currentTimeInMinutes <= endTime) return time;
			return '';
		}

		if (time === '5pm - 5:30pm') {
			const slotStartTime = 17 * 60; // 5:00 PM
			if (currentTimeInMinutes >= startTime && currentTimeInMinutes <= slotStartTime) return time;
			if (currentTimeInMinutes > slotStartTime + 30) return time;
		}
		
		return '';
	}

	// Special Schedule for Dec 26, 2025 (Starts at 5pm)
	if (year === 2025 && month === 12 && day === 26) {
		const startTime = 17 * 60; // 5:00 PM
		const endTime = 21 * 60 + 30; // Friday close 9:30 PM
		
		if (time === 'ASAP') {
			if (currentTimeInMinutes >= startTime && currentTimeInMinutes <= endTime) return time;
			return '';
		}

		if (time === '8pm - 8:30pm') return time;

		if (time === '9pm - 9:30pm') {
			const slotStartTime = 21 * 60; // 9:00 PM
			if (currentTimeInMinutes >= startTime && currentTimeInMinutes <= slotStartTime) return time;
			if (currentTimeInMinutes > slotStartTime + 30) return time;
		}
		
		return '';
	}

	// Sunday (0) to Thursday (4): 9:00 AM (540 min) to 8:30 PM (1230 min)
	if (dayOfWeek >= 0 && dayOfWeek <= 4) {
		if (time === '9pm - 9:30pm') return '';
		
		const startTime = 9 * 60; // 9:00 AM
		const endTime = time === 'ASAP' ? 20 * 60 + 30 : 20 * 60; // 8:30 PM or 8:00 PM
		if (currentTimeInMinutes >= startTime && currentTimeInMinutes <= endTime) return time;

		if (time === 'ASAP') return '';
		if (time === '8pm - 8:30pm' && currentTimeInMinutes > endTime + 30) return time;
	}
	// Friday (5) to Saturday (6): 9:00 AM (540 min) to 9:30 PM (1290 min)
	else if (dayOfWeek >= 5 && dayOfWeek <= 6) {
		if (time === '8pm - 8:30pm') return time;
		
		const startTime = 9 * 60; // 9:00 AM
		let endTime;
		if (time === 'ASAP') {
			endTime = 21 * 60 + 30; // 9:30 PM
		} else { // '9pm - 9:30pm'
			endTime = 21 * 60; // 9:00 PM
		}
		if (currentTimeInMinutes >= startTime && currentTimeInMinutes <= endTime) return time;

		if (time === 'ASAP') return '';
		if (time === '9pm - 9:30pm' && currentTimeInMinutes > endTime + 30) return time;
	}
	return '';
};

export const getDynamicDeliveryTimes = () => {
	console.log('times called');
	const { year, month, day } = getVancouverDateTime();
	const isDec22 = year === 2025 && month === 12 && day === 22;
	const isDec26 = year === 2025 && month === 12 && day === 26;

	const baseDeliveryTimes = [
		shouldIncludeDeliveryTime("ASAP"),
	];

	if (!isDec26) {
		baseDeliveryTimes.push(
			"9am - 10am",
			"10am - 11am",
			"11am - 12pm",
			"12pm - 1pm",
			"1pm - 2pm",
			"2pm - 3pm",
			"3pm - 4pm"
		);
	}

	if (isDec22) {
		baseDeliveryTimes.push(
			"4pm - 5pm",
			shouldIncludeDeliveryTime("5pm - 5:30pm")
		);
	} else {
		if (!isDec26) {
			baseDeliveryTimes.push("4pm - 5pm");
		}
		baseDeliveryTimes.push(
			"5pm - 6pm",
			"6pm - 7pm",
			"7pm - 8pm",
			shouldIncludeDeliveryTime("8pm - 8:30pm"),
			shouldIncludeDeliveryTime("9pm - 9:30pm")
		);
	}

	return baseDeliveryTimes.filter(item => item !== "");
};
