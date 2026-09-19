const { TemplateCount } = require("../util/template");

class BaseStatment {
  toInstruction(count, mode) {
    const isRoot = !count;
    count = count || new TemplateCount();
    const template = this.compile(count, mode);

    if (isRoot && !mode) {
      return { template, values: count.getLiterals() };
    }

    return template;
  }
}

module.exports = { BaseStatment };