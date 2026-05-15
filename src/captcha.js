/**
 * VeriGuard - Captcha Verification Module
 * Generates simple math captcha challenges
 */

class CaptchaEngine {
  constructor() {
    this.operations = ['+', '-', '*'];
  }

  /**
   * Generate a random math captcha
   * @param {string} difficulty - 'easy', 'medium', 'hard'
   * @returns {{ question: string, answer: number }}
   */
  generate(difficulty = 'easy') {
    switch (difficulty) {
      case 'easy':
        return this._easyCaptcha();
      case 'medium':
        return this._mediumCaptcha();
      case 'hard':
        return this._hardCaptcha();
      default:
        return this._easyCaptcha();
    }
  }

  _easyCaptcha() {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    return {
      question: `${a} + ${b}`,
      answer: a + b,
    };
  }

  _mediumCaptcha() {
    const op = this.operations[Math.floor(Math.random() * this.operations.length)];
    let a, b, answer;

    switch (op) {
      case '+':
        a = Math.floor(Math.random() * 50) + 1;
        b = Math.floor(Math.random() * 50) + 1;
        answer = a + b;
        break;
      case '-':
        a = Math.floor(Math.random() * 50) + 1;
        b = Math.floor(Math.random() * a) + 1; // ensure positive result
        answer = a - b;
        break;
      case '*':
        a = Math.floor(Math.random() * 12) + 1;
        b = Math.floor(Math.random() * 12) + 1;
        answer = a * b;
        break;
    }

    return { question: `${a} ${op} ${b}`, answer };
  }

  _hardCaptcha() {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    const c = Math.floor(Math.random() * 10) + 1;
    // Example: a + b * c (order of operations)
    const answer = a + b * c;
    return {
      question: `${a} + ${b} × ${c}`,
      answer,
    };
  }
}

module.exports = new CaptchaEngine();