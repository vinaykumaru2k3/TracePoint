struct Node { int val; Node* left = nullptr; Node* right = nullptr; Node(int v) : val(v) {} };

struct BST {
    Node* root = nullptr;

    bool insert(int v) {                                      // @a ins.sig
        if (!root) { root = new Node(v); return true; }       // @a ins.root
        Node* cur = root;
        while (true) {
            if (v == cur->val) return false;                  // @a ins.dup
            if (v < cur->val) {                               // @a ins.cmp
                if (!cur->left) { cur->left = new Node(v); return true; }    // @a ins.attach
                cur = cur->left;
            } else {
                if (!cur->right) { cur->right = new Node(v); return true; }  // @a ins.attach
                cur = cur->right;
            }
        }
    }

    bool search(int v) {                                      // @a find.sig
        Node* cur = root;
        while (cur) {
            if (v == cur->val) return true;                   // @a find.hit
            cur = v < cur->val ? cur->left : cur->right;      // @a find.step
        }
        return false;                                         // @a find.miss
    }

    Node* remove(Node* n, int v) {                            // @a del.sig
        if (!n) return nullptr;                               // @a del.miss
        if (v < n->val) n->left = remove(n->left, v);         // @a del.step
        else if (v > n->val) n->right = remove(n->right, v);  // @a del.step
        else {
            if (!n->left && !n->right) { delete n; return nullptr; }   // @a del.leaf
            if (!n->left) { Node* r = n->right; delete n; return r; }  // @a del.one
            if (!n->right) { Node* l = n->left; delete n; return l; }  // @a del.one
            Node* s = n->right;                               // @a del.succ
            while (s->left) s = s->left;                      // @a del.succ
            n->val = s->val;                                  // @a del.copy
            n->right = remove(n->right, s->val);              // @a del.drop
        }
        return n;
    }
};
