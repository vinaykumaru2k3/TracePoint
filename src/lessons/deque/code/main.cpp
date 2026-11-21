#include <stdexcept>

class ArrayDeque6 {
    int data[6];
    int head = 0, size = 0;
public:
    void pushFront(int x) {                             // @a pushFront.sig
        if (size == 6)                                  // @a pushFront.check
            throw std::length_error("full");
        head = (head - 1 + 6) % 6;                      // @a pushFront.move
        data[head] = x;                                 // @a pushFront.write
        size++;
    }

    void pushBack(int x) {                              // @a pushBack.sig
        if (size == 6)                                  // @a pushBack.check
            throw std::length_error("full");
        data[(head + size) % 6] = x;                    // @a pushBack.write
        size++;
    }

    int popFront() {                                    // @a popFront.sig
        if (size == 0)                                  // @a popFront.check
            throw std::out_of_range("empty");
        int x = data[head];
        head = (head + 1) % 6;                          // @a popFront.move
        size--;
        return x;
    }

    int popBack() {                                     // @a popBack.sig
        if (size == 0)                                  // @a popBack.check
            throw std::out_of_range("empty");
        int x = data[(head + size - 1) % 6];            // @a popBack.read
        size--;
        return x;
    }
};
