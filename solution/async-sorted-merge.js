"use strict";

var Heap = require("mnemonist/heap");
// Print all entries, across all of the *async* sources, in chronological order.

const MAX_HEAP_SIZE = 5000;

async function AsyncSortMerge(logSources, printer) {
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

  //We need to make sure that an entry from each log source is stored in the heap to
  //be able to properly determine which is the next one to be printed.
  await Promise.all(
    logSources.map(async (src, index) => {
      let logEntry = await src.popAsync();
      var entry = { entry: logEntry, srcIndex: index };
      heap.push(entry);
    })
  );

  //Since we are doing asynchronous calls here, we can set an interval to constantly be adding entries to the heap
  //as long as we are not reaching whatever our maximum heap size should be.
  const getEntriesFromLogs = () => {
    if (heap.size + logSources.length <= MAX_HEAP_SIZE) {
      logSources.map(async (src, index) => {
        if (src.drained) {
          return; //no need to continue if we know that there is no more entries.
        }

        let logEntry = await src.popAsync();
        if (logEntry !== false) {
          var entry = { entry: logEntry, srcIndex: index };
          heap.push(entry);
        }
      });
    }
  };

  setInterval(getEntriesFromLogs, 1);

  //Our printing function, after we take an entry from the heap, we always make sure to replace it with another entry from the same log source.
  //This ensures that our heap will always have at least 1 entry from each log source.
  while (heap.size > 0) {
    let entryInfo = heap.pop();
    printer.print(entryInfo.entry);

    let lastSource = logSources[entryInfo.srcIndex];
    var newEntry = await lastSource.popAsync();
    if (newEntry) {
      heap.push({ entry: newEntry, srcIndex: entryInfo.srcIndex });
    }
  }

  //For performance conerns we might want to have a better way of clearing the interval when we know all the log sources are drained, but this keeps it simple.
  clearInterval(getEntriesFromLogs());

  console.log("Async sort complete.");
  printer.done();
}

module.exports = (logSources, printer) => {
  return new Promise((resolve, reject) => {
    (async () => {
      await AsyncSortMerge(logSources, printer);
    })();
  });
};
