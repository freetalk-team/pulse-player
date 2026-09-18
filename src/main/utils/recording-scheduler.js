
export class RecordingScheduler {
    #timer = null;
    #running = new Map();
	#schedules = [];
    #isTicking = false;
	#service;

    constructor(service) {
        this.#service = service;
    }

	init(schedules) {
		this.#schedules = schedules;

		for (const schedule of this.#schedules)
			fixTime(schedule);

		this.#start();
	}
	
	addSchedule(schedule) {
		fixTime(schedule);

		this.#schedules.push(schedule);
		this.#start();
	}

	removeSchedule(id) {
		console.debug('[RECORDING SCHEDULER] remove:', this.#schedules, id);

		this.#schedules = this.#schedules.filter(i => i.id != id);
		this.#stopSchedule(id);
	}

	setActive(id, active) {
		const schedule = this.#schedules.find(i => i.id == id);
		if (schedule)
			schedule.is_active = active;

		if (active) this.#start();
		else this.#stop();
	}

    #start() {
        if (this.#timer) {
            return;
        }

		const hasActive = this.#schedules.some(i => i.is_active);
		if (!hasActive) return;

        this.#tick();

        this.#timer = setInterval(
            () => this.#tick(),
            10_000
        );
    }

    #stop() {
		if (this.#running.size > 0) return;

		const hasActive = this.#schedules.some(i => i.is_active);
		if (hasActive) return;

        if (this.#timer) {
            clearInterval(this.#timer);
            this.#timer = null;
        }

        // for (const scheduleId of [...this.#running.keys()]) {
        //     this.#stopSchedule(scheduleId);
        // }
    }

    #tick() {
        // Prevent overlapping ticks
        if (this.#isTicking) {
            return;
        }

        this.#isTicking = true;

		console.debug('[RECORDING SCHEDULER]: tick');

        try {
            const now = new Date();

            for (const schedule of this.#schedules) {
                this.#processSchedule(schedule, now);
            }

            // this.#processRunningSchedules(
            //     this.#schedules,
            //     now
            // );
        }
        catch (error) {
            console.error(
                'Recording scheduler tick failed:',
                error
            );
        }
        finally {
            this.#isTicking = false;
        }
    }

	#startSchedule(schedule) {
		console.debug('[RECORDING SCHEDULER] start:', schedule.id, schedule.station_name);

        const meta = { 
            title: schedule.title, 
            artist: schedule.artist 
        };

        this.#running.set(schedule.id, schedule);
		this.#service.startRecording(schedule.station_id, meta);

	}

	#stopSchedule(scheduleId) {
		//console.trace('Stop call stack');
		//console.debug('[RECORDING SCHEDULER] stop:', scheduleId);

		const schedule = this.#running.get(scheduleId);
		if (schedule) {
			this.#service.stopRecording(schedule.station_id);
			this.#running.delete(scheduleId);
		}

		this.#stop();
	}

    #processSchedule(schedule, now) {
		if (!schedule.is_active) return;

        const shouldRecord = this.#shouldRecordNow(schedule, now);

        const isRunning =
            this.#running.has(schedule.id);

        if (shouldRecord && !isRunning) {
            this.#startSchedule(schedule);
        }
        else if (!shouldRecord && isRunning) {
			if (schedule.repeat == 'None') {
				this.#service.removeRecording(schedule.id);
			}
			else {
				this.#stopSchedule(schedule.id);
			}
        }
    }

    #processRunningSchedules(schedules, now) {
        const activeSchedules = new Map(
            schedules.map(s => [s.id, s])
        );

        for (const [scheduleId] of this.#running) {
            const schedule =
                activeSchedules.get(scheduleId);

            if (!schedule) {
                this.#stopSchedule(scheduleId);
                continue;
            }

            if (!this.#shouldRecordNow(schedule, now)) {
				if (schedule.repeat == 'None') {
					this.#service.removeRecording(scheduleId);
				}
				else {
					this.#stopSchedule(scheduleId);
				}
            }
        }
    }

   #shouldRecordNow(schedule, now) {
        switch (schedule.repeat) {
            case 'None':
                return this.#isNoneScheduleActive(schedule, now);

            case 'Daily':
                return this.#isDailyScheduleActive(schedule, now);

            case 'Weekly':
                return this.#isWeeklyScheduleActive(schedule, now);

            default:
                return false;
        }
    }

    #isNoneScheduleActive(schedule, now) {
        const start = new Date(schedule.start_time);
        const end = new Date(schedule.end_time);

		//console.debug('Checking none schedule:', start, now, schedule.repeat);

        return now >= start && now < end;
    }

    #isDailyScheduleActive(schedule, now) {
        const originalStart = new Date(schedule.start_time);
        const originalEnd = new Date(schedule.end_time);

        const duration =
            originalEnd.getTime() - originalStart.getTime();

        if (duration <= 0) {
            return false;
        }

        const start = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            originalStart.getUTCHours(),
            originalStart.getUTCMinutes(),
            originalStart.getUTCSeconds()
        ));

        const end = new Date(start.getTime() + duration);

        if (now >= start && now < end) {
            return true;
        }

        const previousStart = new Date(
            start.getTime() - 24 * 60 * 60 * 1000
        );

        const previousEnd = new Date(
            previousStart.getTime() + duration
        );

        return now >= previousStart && now < previousEnd;
    }

    #isWeeklyScheduleActive(schedule, now) {
        const originalStart = new Date(schedule.start_time);
        const originalEnd = new Date(schedule.end_time);

        const duration =
            originalEnd.getTime() - originalStart.getTime();

        if (duration <= 0) {
            return false;
        }

        const targetWeekday =
            originalStart.getUTCDay();

        const currentWeekday =
            now.getUTCDay();

        let daysBack =
            currentWeekday - targetWeekday;

        if (daysBack < 0) {
            daysBack += 7;
        }

        const start = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            originalStart.getUTCHours(),
            originalStart.getUTCMinutes(),
            originalStart.getUTCSeconds()
        ));

        start.setUTCDate(
            start.getUTCDate() - daysBack
        );

        const end = new Date(
            start.getTime() + duration
        );

        return now >= start && now < end;
    }
}

function fixTime(schedule) {
	schedule.start_time += ':00Z';
	schedule.end_time += ':00Z';
}