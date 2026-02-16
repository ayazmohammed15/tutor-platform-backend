const AvailabilitySlot = require('../models/AvailabilitySlot');

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

module.exports = {
  createSlot,
  getMySlots,
  getTutorSlots,
  updateSlot,
  deleteSlot,
  saveAvailability
};
