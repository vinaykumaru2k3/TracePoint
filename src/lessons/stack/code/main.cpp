#include <stdexcept>

class ArrayStack {
  int data[6];
  int top = -1;

 public:
  void push(int x) {                              // @a push.sig
    if (top == 5)                                 // @a push.check
      throw std::overflow_error("stack is full");
    data[++top] = x;                              // @a push.write
  }

  int pop() {                                     // @a pop.sig
    if (top == -1)                                // @a pop.check
      throw std::underflow_error("stack is empty");
    return data[top--];                           // @a pop.return
  }

  int peek() const {                              // @a peek.sig
    if (top == -1)                                // @a peek.check
      throw std::underflow_error("stack is empty");
    return data[top];                             // @a peek.return
  }
};
