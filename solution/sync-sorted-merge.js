"use strict";

var Heap = require("mnemonist/heap");

// Print all entries, across all of the sources, in chronological order.

module.exports = (logSources, printer) => {
  //Our heap, sorts by the date ascending.
  var heap = new Heap(function (a, b) {
    if (a.entry.date.getTime() > b.entry.date.getTime()) {
      return 1;
    }
    if (b.entry.date.getTime() > a.entry.date.getTime()) {
      return -1;
    }
    return 0;
  });

  //Add one entry from each log source into the heap.
  logSources.forEach((src, index) => {
    var entry = { entry: src.pop(), srcIndex: index };
    heap.push(entry);
  });

  //Print the earliest entry, and replace that entry from the heap with one from the same log source.
  while (heap.size > 0) {
    let entry = heap.pop();
    printer.print(entry.entry);

    let lastSource = logSources[entry.srcIndex];
    var newEntry = lastSource.pop();
    if (newEntry) {
      heap.push({ entry: newEntry, srcIndex: entry.srcIndex });
    }
  }

  console.log("Sync sort complete.");
  printer.done();
};
