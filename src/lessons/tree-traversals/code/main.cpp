#include <queue>
#include <vector>

struct Node { int val; Node* left = nullptr; Node* right = nullptr; };

void preorder(Node* n, std::vector<int>& out) {     // @a pre.sig
    if (!n) return;
    out.push_back(n->val);                          // @a pre.visit
    preorder(n->left, out);
    preorder(n->right, out);
}

void inorder(Node* n, std::vector<int>& out) {      // @a in.sig
    if (!n) return;
    inorder(n->left, out);
    out.push_back(n->val);                          // @a in.visit
    inorder(n->right, out);
}

void postorder(Node* n, std::vector<int>& out) {    // @a post.sig
    if (!n) return;
    postorder(n->left, out);
    postorder(n->right, out);
    out.push_back(n->val);                          // @a post.visit
}

std::vector<int> levelOrder(Node* root) {           // @a lvl.sig
    std::vector<int> out;
    std::queue<Node*> q;
    if (root) q.push(root);                         // @a lvl.init
    while (!q.empty()) {
        Node* n = q.front(); q.pop();               // @a lvl.poll
        out.push_back(n->val);                      // @a lvl.visit
        if (n->left) q.push(n->left);               // @a lvl.push
        if (n->right) q.push(n->right);             // @a lvl.push
    }
    return out;                                     // @a lvl.done
}
