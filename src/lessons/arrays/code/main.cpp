#include <stdexcept>

class IntArray {
    int data[7];
    int size = 0;
public:
    int get(int i) {                                    // @a get.sig
        if (i < 0 || i >= size)                         // @a get.check
            throw std::out_of_range("index");
        return data[i];                                 // @a get.return
    }

    void append(int x) {                                // @a append.sig
        if (size == 7)                                  // @a append.check
            throw std::length_error("full");
        data[size++] = x;                               // @a append.write
    }

    void insert(int i, int x) {                         // @a insert.sig
        if (size == 7 || i < 0 || i > size)             // @a insert.check
            throw std::out_of_range("index");
        for (int k = size; k > i; k--)
            data[k] = data[k - 1];                      // @a insert.shift
        data[i] = x;                                    // @a insert.write
        size++;
    }

    int remove(int i) {                                 // @a remove.sig
        if (i < 0 || i >= size)                         // @a remove.check
            throw std::out_of_range("index");
        int x = data[i];
        for (int k = i; k < size - 1; k++)
            data[k] = data[k + 1];                      // @a remove.shift
        size--;                                         // @a remove.done
        return x;
    }
};
