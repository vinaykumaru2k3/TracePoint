struct Node { int val; Node* next = nullptr; Node(int v) : val(v) {} };

class SinglyLinkedList {
    Node* head = nullptr;
    Node* tail = nullptr;
public:
    void addFirst(int x) {                          // @a addFirst.sig
        Node* n = new Node(x);                      // @a addFirst.new
        n->next = head;                             // @a addFirst.link
        head = n;                                   // @a addFirst.head
        if (!tail) tail = n;
    }

    void addLast(int x) {                           // @a addLast.sig
        Node* n = new Node(x);                      // @a addLast.new
        if (!tail) { head = tail = n; return; }     // @a addLast.empty
        tail->next = n;                             // @a addLast.link
        tail = n;                                   // @a addLast.tail
    }

    bool contains(int x) {                          // @a contains.sig
        for (Node* cur = head; cur; cur = cur->next) // @a contains.walk
            if (cur->val == x) return true;         // @a contains.hit
        return false;                               // @a contains.miss
    }

    bool remove(int x) {                            // @a delete.sig
        Node* prev = nullptr; Node* cur = head;
        while (cur && cur->val != x) { prev = cur; cur = cur->next; } // @a delete.walk
        if (!cur) return false;                     // @a delete.miss
        if (!prev) head = cur->next;                // @a delete.head
        else prev->next = cur->next;                // @a delete.unlink
        if (cur == tail) tail = prev;               // @a delete.tail
        delete cur;
        return true;
    }
};
