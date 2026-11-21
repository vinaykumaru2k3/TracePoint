class ArrayQueue {
  private int[] data = new int[4];
  private int head = 0, size = 0;

  void offer(int x) {                             // @a offer.sig
    if (size == data.length)                      // @a offer.check
      throw new IllegalStateException();
    data[(head + size) % data.length] = x;        // @a offer.write
    size++;                                       // @a offer.size
  }

  Integer poll() {                                // @a poll.sig
    if (size == 0) return null;                   // @a poll.check
    int x = data[head];                           // @a poll.read
    head = (head + 1) % data.length;              // @a poll.head
    size--;                                       // @a poll.size
    return x;                                     // @a poll.return
  }

  Integer peek() {                                // @a peek.sig
    return size == 0 ? null : data[head];         // @a peek.return
  }
}
