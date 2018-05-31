'use strict';

var DepositeContent = function (text) {
  if (text) {
    var o = JSON.parse(text);
    this.text = o.text;
    this.owner = o.owner;
    this.price = new BigNumber(o.price);
    this.expiryHeight = new BigNumber(o.expiryHeight);
  } else {
    this.text = "";
    this.owner = "";
    this.price = new BigNumber(0);
    this.expiryHeight = new BigNumber(0);
  }
};

DepositeContent.prototype = {
  toString: function () {
    return JSON.stringify(this);
  }
};

var WordContract = function () {
  LocalContractStorage.defineMapProperty(this, "word", {
    parse: function (text) {
      return new DepositeContent(text);
    },
    stringify: function (o) {
      return o.toString();
    }
  });
};

WordContract.prototype = {
  init: function () {
    var content = new DepositeContent();
    content.text = "";
    content.owner = "";
    content.price = 0;
    content.expiryHeight = 0;
    this.word.put("word_of_day", content);
  },

  save: function (height, text) {
    var to = Blockchain.transaction.to;
    var from = Blockchain.transaction.from;
    var value = Blockchain.transaction.value;
    var bk_height = new BigNumber(Blockchain.block.height);
    var orig_deposit = this.word.get("word_of_day");
    var price = new BigNumber(orig_deposit.price);
    if(price <= value && text.length <= 250) {
      if(orig_deposit.owner.length !== 0) {
        var result = Blockchain.transfer(orig_deposit.owner, value);
        if (!result) {
          throw new Error("transfer failed.");
        }
        Event.Trigger("word_of_day", {
          Transfer: {
            from: to,
            to: orig_deposit.owner,
            value: value.toString()
          }
        });
      }
      if(price.isZero()) {
        price = value;
      }
      var content = new DepositeContent();
      content.text = text;
      content.owner = from;
      content.price = price*2;
      content.expiryHeight = bk_height.plus(height);
      this.word.put("word_of_day", content);
      return content;
    } else {
      throw new Error("Deposite should be greater then current price");
    }
  },
  get: function () {
    return this.word.get("word_of_day");
  },
};
module.exports = WordContract;