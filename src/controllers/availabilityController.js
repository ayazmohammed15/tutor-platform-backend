const AvailabilitySlot = require('../models/AvailabilitySlot');
const { get } = require('../routes/availabilityRoutes');
const Session = require('../models/Session');

const createSlot = async (req, res, next) => {
  try {
    if (req.user.role !== 'tutor') {
      return res.status(403).json({
        success: false,
        message: 'Only tutors can create availability slots'
      });
    }

    const { day_of_week, start_time, end_time } = req.body;

    const slotId = await AvailabilitySlot.create({
      tutor_id: req.user.id,
      day_of_week,
      start_time,
      end_time
    });

    const slot = await AvailabilitySlot.findById(slotId);

    res.status(201).json({
      success: true,
      message: 'Availability slot created successfully',
      data: { slot }
    });
  } catch (error) {
    next(error);
  }
};

const getMySlots = async (req, res, next) => {
  try {
    const slots = await AvailabilitySlot.findByTutorId(req.user.id);

    res.status(200).json({
      success: true,
      data: { slots, count: slots.length }
    });
  } catch (error) {
    next(error);
  }
};

const getTutorSlots = async (req, res, next) => {
  try {
    const { tutorId } = req.params;

    const slots = await AvailabilitySlot.findByTutorId(tutorId);

    res.status(200).json({
      success: true,
      data: { slots, count: slots.length }
    });
  } catch (error) {
    next(error);
  }
};

const updateSlot = async (req, res, next) => {
  try {
    const { slotId } = req.params;
    const { day_of_week, start_time, end_time, is_available } = req.body;

    const updates = {};
    if (day_of_week !== undefined) updates.day_of_week = day_of_week;
    if (start_time !== undefined) updates.start_time = start_time;
    if (end_time !== undefined) updates.end_time = end_time;
    if (is_available !== undefined) updates.is_available = is_available;

    const updated = await AvailabilitySlot.update(slotId, req.user.id, updates);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found or no changes made'
      });
    }

    const slot = await AvailabilitySlot.findById(slotId);

    res.status(200).json({
      success: true,
      message: 'Availability slot updated successfully',
      data: { slot }
    });
  } catch (error) {
    next(error);
  }
};

const deleteSlot = async (req, res, next) => {
  try {
    const { slotId } = req.params;

    const deleted = await AvailabilitySlot.delete(slotId, req.user.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Availability slot deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getAvailableSlots = async (req, res, next) => {
  try {
    const { tutorId, date } = req.params;

    const range = await AvailabilitySlot.getRange(tutorId);

    if (!range || date < range.start_date || date > range.end_date) {
      return res.status(200).json({
        success: true,
        data: { slots: [] }
      });
    }

    const excludedDates = await AvailabilitySlot.getExcludedDates(tutorId);
    const isExcluded = excludedDates.some(d =>
      d.date.toISOString().split('T')[0] === date
    );

    if (isExcluded) {
      return res.status(200).json({
        success: true,
        data: { slots: [] }
      });
    }

    const dayName = new Date(date).toLocaleString('en-US', { weekday: 'long' });

    const weeklySlots = await AvailabilitySlot.findByTutorId(tutorId);
    const dayBlocks = weeklySlots.filter(
      slot => slot.day_of_week === dayName
    );

    let generatedSlots = [];

    dayBlocks.forEach(block => {
      let current = new Date(`1970-01-01T${block.start_time}`);
      const endTime = new Date(`1970-01-01T${block.end_time}`);
      const duration = block.slot_duration;

      while (current < endTime) {
        generatedSlots.push(current.toTimeString().slice(0, 5));
        current = new Date(current.getTime() + duration * 60000);
      }
    });

    const booked = await Session.findBookedSlots(tutorId, date);
    const bookedTimes = booked.map(b =>
      b.scheduled_time.slice(0, 5)
    );

    const available = generatedSlots.filter(
      slot => !bookedTimes.includes(slot)
    );

    res.status(200).json({
      success: true,
      data: { slots: available }
    });

  } catch (error) {
    next(error);
  }
};


const saveAvailability = async (req, res, next) => {
  try {
    if (req.user.role !== 'tutor') {
      return res.status(403).json({
        success: false,
        message: 'Only tutors can set availability'
      });
    }

    const tutorId = req.user.id;
    const { start_date, end_date, weekly_schedule, excluded_dates } = req.body;

    await AvailabilitySlot.deleteAllByTutor(tutorId);
    await AvailabilitySlot.deleteExcludedByTutor(tutorId);

    await AvailabilitySlot.saveRange(tutorId, start_date, end_date);

    for (const day of weekly_schedule) {
      for (const block of day.blocks) {
        await AvailabilitySlot.create({
          tutor_id: tutorId,
          day_of_week: day.day,
          start_time: block.start_time,
          end_time: block.end_time,
          slot_duration: block.slot_duration
        });
      }
    }

    for (const date of excluded_dates) {
      await AvailabilitySlot.addExcludedDate(tutorId, date);
    }

    res.status(200).json({
      success: true,
      message: 'Availability saved successfully'
    });

  } catch (error) {
    next(error);
  }
};

const getAvailableSlotsByDate = async (req, res, next) => {
  try {
    const { tutorId, date } = req.params;

    // 1️⃣ Check availability range
    // 1️⃣ Check availability range properly
    const range = await AvailabilitySlot.getRange(tutorId);

    if (!range) {
      return res.status(200).json({
        success: true,
        data: { date, slots: [] }
      });
    }

    const selectedDate = new Date(date);
    const startDate = new Date(range.start_date);
    const endDate = new Date(range.end_date);

    // Normalize times
    selectedDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (selectedDate < startDate || selectedDate > endDate) {
      return res.status(200).json({
        success: true,
        data: { date, slots: [] }
      });
    }

    // 2️⃣ Check excluded date
    const excludedDates = await AvailabilitySlot.getExcludedDates(tutorId);

    const isExcluded = excludedDates.some(d => d.date === date);

    if (isExcluded) {
      return res.status(200).json({
        success: true,
        data: { date, slots: [] }
      });
    }

    // 3️⃣ Get day of week
    const dayOfWeek = new Date(date)
      .toLocaleDateString('en-US', { weekday: 'long' });

    const weeklyBlocks = await AvailabilitySlot.findByTutorId(tutorId);
    const dayBlocks = weeklyBlocks.filter(b => b.day_of_week === dayOfWeek);

    let generatedSlots = [];

    // 4️⃣ Generate slots
    const BUFFER_MINUTES = 15;

    dayBlocks.forEach(block => {

      let current = block.start_time;
      const end = block.end_time;
      const duration = block.slot_duration;

      while (true) {

        const [h, m] = current.split(':').map(Number);

        const startTime = new Date(0, 0, 0, h, m);
        const endTime = new Date(startTime.getTime() + duration * 60000);

        const endStr = endTime.toTimeString().slice(0, 5);

        if (endStr > end) break;

        generatedSlots.push(current);

        const nextStart = new Date(
          startTime.getTime() + (duration + BUFFER_MINUTES) * 60000
        );

        current = nextStart.toTimeString().slice(0, 5);

      }

    });

    // 5️⃣ Get booked sessions for that date
    const bookedSessions = await Session.findByTutorId(tutorId);

    const bookedTimes = bookedSessions
      .filter(s => s.scheduled_date === date)
      .map(s => s.scheduled_time.slice(0, 5));

    // 6️⃣ Return structured slots
    const structuredSlots = generatedSlots.map(time => ({
      time,
      booked: bookedTimes.includes(time)
    }));

    res.status(200).json({
      success: true,
      data: {
        date,
        slots: structuredSlots
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSlot,
  getMySlots,
  getTutorSlots,
  getAvailableSlots,
  getAvailableSlotsByDate,
  updateSlot,
  deleteSlot,
  saveAvailability
};
