const mongoose = require('mongoose');

const NodeSchema = new mongoose.Schema({
    type: { type: String, required: true },
    left: { type: mongoose.Schema.Types.Mixed },
    right: { type: mongoose.Schema.Types.Mixed },
    value: { type: mongoose.Schema.Types.Mixed }
});

const RuleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rule: { type: NodeSchema, required: true }
});

module.exports = mongoose.model('Rule', RuleSchema);
