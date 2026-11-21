#include <stdexcept>

struct Node { int val; Node* prev = nullptr; Node* next = nullptr; Node(int v) : val(v) {} };

class DoublyLinkedList {
    Node* head = nullptr;
    Node* tail = nullptr;
public:
    void addFirst(int x) {                          // @a addFirst.sig
        Node* n = new Node(x);                      // @a addFirst.new
        n->next = head;                             // @a addFirst.link
        if (head) head->prev = n; else tail = n;    // @a addFirst.back
        head = n;                                   // @a addFirst.head
    }

    void addLast(int x) {                           // @a addLast.sig
        Node* n = new Node(x);                      // @a addLast.new
        n->prev = tail;                             // @a addLast.link
        if (tail) tail->next = n; else head = n;    // @a addLast.back
        tail = n;                                   // @a addLast.tail
    }

    int removeFirst() {                             // @a removeFirst.sig
        if (!head)                                  // @a removeFirst.check
            throw std::out_of_range("empty");
        Node* old = head; int x = old->val;
        head = head->next;                          // @a removeFirst.move
        if (head) head->prev = nullptr; else tail = nullptr; // @a removeFirst.cut
        delete old;
        return x;
    }

    int removeLast() {                              // @a removeLast.sig
        if (!tail)                                  // @a removeLast.check
            throw std::out_of_range("empty");
        Node* old = tail; int x = old->val;
        tail = tail->prev;                          // @a removeLast.move
        if (tail) tail->next = nullptr; else head = nullptr; // @a removeLast.cut
        delete old;
        return x;
    }
};
