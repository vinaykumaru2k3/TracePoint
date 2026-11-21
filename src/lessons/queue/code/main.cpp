#include <optional>
#include <stdexcept>

class ArrayQueue {
  int data[4];
  int head = 0, size = 0;

 public:
  void offer(int x) {                             // @a offer.sig
    if (size == 4)                                // @a offer.check
      throw std::overflow_error("queue is full");
    data[(head + size) % 4] = x;                  // @a offer.write
    size++;                                       // @a offer.size
  }

  std::optional<int> poll() {                     // @a poll.sig
    if (size == 0) return std::nullopt;           // @a poll.check
    int x = data[head];                           // @a poll.read
    head = (head + 1) % 4;                        // @a poll.head
    size--;                                       // @a poll.size
    return x;                                     // @a poll.return
  }

  std::optional<int> peek() const {               // @a peek.sig
    return size == 0 ? std::nullopt : std::optional<int>(data[head]);   // @a peek.return
  }
};
