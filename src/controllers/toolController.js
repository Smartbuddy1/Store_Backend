const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllTools = async (req, res) => {
  try {
    const tools = await prisma.tool.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: tools });
  } catch (error) {
    console.error('Error fetching tools:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.createTool = async (req, res) => {
  try {
    const { toolCode, toolName } = req.body;
    const tool = await prisma.tool.create({
      data: { toolCode, toolName }
    });
    res.status(201).json({ success: true, data: tool });
  } catch (error) {
    console.error('Error creating tool:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.deleteTool = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.tool.delete({ where: { id } });
    res.json({ success: true, message: 'Tool deleted successfully' });
  } catch (error) {
    console.error('Error deleting tool:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.updateTool = async (req, res) => {
  try {
    const { id } = req.params;
    const { toolCode, toolName } = req.body;
    const tool = await prisma.tool.update({
      where: { id },
      data: { toolCode, toolName }
    });
    res.json({ success: true, data: tool });
  } catch (error) {
    console.error('Error updating tool:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Logs
exports.getAllLogs = async (req, res) => {
  try {
    const logs = await prisma.toolLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tool: true
      }
    });
    // Format to match frontend needs
    const formatted = logs.map(log => ({
      id: log.id,
      toolCode: log.toolCode,
      toolName: log.tool?.toolName || 'Unknown',
      helperName: log.helperName,
      issueTime: log.issueTime,
      returnTime: log.returnTime,
      status: log.status,
      date: log.date ? new Date(log.date).toISOString().split('T')[0] : ''
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching tool logs:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.issueTool = async (req, res) => {
  try {
    const { toolCode, helperName, issueTime } = req.body || {};
    if (!toolCode || !helperName || !issueTime) {
      return res.status(400).json({ success: false, message: 'toolCode, helperName, and issueTime are required' });
    }
    const log = await prisma.toolLog.create({
      data: { toolCode, helperName, issueTime, status: 'ISSUED' }
    });
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    console.error('Error issuing tool:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.returnTool = async (req, res) => {
  try {
    const { id } = req.params;
    const { returnTime } = req.body;
    const log = await prisma.toolLog.update({
      where: { id },
      data: { returnTime, status: 'RETURNED' }
    });
    res.json({ success: true, data: log });
  } catch (error) {
    console.error('Error returning tool:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.updateLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { toolCode, helperName, issueTime, returnTime, status } = req.body;
    const data = {};
    if (toolCode !== undefined) data.toolCode = toolCode;
    if (helperName !== undefined) data.helperName = helperName;
    if (issueTime !== undefined) data.issueTime = issueTime;
    if (returnTime !== undefined) data.returnTime = returnTime;
    if (status !== undefined) data.status = status;
    const log = await prisma.toolLog.update({ where: { id }, data });
    res.json({ success: true, data: log });
  } catch (error) {
    console.error('Error updating tool log:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.deleteLog = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.toolLog.delete({ where: { id } });
    res.json({ success: true, message: 'Log deleted successfully' });
  } catch (error) {
    console.error('Error deleting tool log:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
