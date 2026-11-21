struct Node { int val; Node* next = nullptr; Node(int v) : val(v) {} };

bool hasCycle(Node* head) {                         // @a fs.sig
    Node* slow = head; Node* fast = head;           // @a fs.init
    while (fast && fast->next) {                    // @a fs.loop
        slow = slow->next;                          // @a fs.slow
        fast = fast->next->next;                    // @a fs.fast
        if (slow == fast) return true;              // @a fs.meet
    }
    return false;                                   // @a fs.none
}
