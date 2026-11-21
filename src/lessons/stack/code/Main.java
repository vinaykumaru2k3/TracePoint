class ArrayStack {
  private int[] data = new int[6];
  private int top = -1;

  void push(int x) {                              // @a push.sig
    if (top == data.length - 1)                   // @a push.check
      throw new IllegalStateException();
    data[++top] = x;                              // @a push.write
  }

  int pop() {                                     // @a pop.sig
    if (top == -1) throw new EmptyStackException(); // @a pop.check
    return data[top--];                           // @a pop.return
  }

  int peek() {                                    // @a peek.sig
    if (top == -1) throw new EmptyStackException(); // @a peek.check
    return data[top];                             // @a peek.return
  }
}
