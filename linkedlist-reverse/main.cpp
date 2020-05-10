#include <iostream>
#include <stdexcept> //to call std::out_of_range exception on linked lists (which isn't really necessary but makes a good linked list class)
#include <string>

using namespace std; //if this bothers you, too bad

template <typename T>
struct Node {
	T data;
	Node<T>* next;
	Node(T stuff){
		data = stuff;
		next = nullptr;
	}
};

template <typename T>
class LinkedList {
protected:
	Node<T>* first;
	Node<T>* last;
	int length;
public:
	static const std::string errorMessage;

	void insert(T data, int index){
		if(index<0 || index>length){
			throw std::out_of_range(errorMessage);
		}
		Node<T>* newData = new Node<T>(data);

		if(index == 0){
			//prepend
			Node<T>* temp = first;
			first = newData;
			first->next = temp;
		}else if(index == length){
			//append
			last->next = newData;
			last = newData;
		}else{
			Node<T>* before = get(index-1);
			Node<T>* after = get(index);
			before->next = newData;
			newData->next = after;
		}

		length++;
	}
	void arrayInsert(T* data, int size, int index){
		if(size == 0){
			return;
		}
		if(size == 1){
			insert(data[0], index);
			return;
		}

		if(index<0 || index>length){
			throw std::out_of_range(errorMessage);
		}

		if(index == 0){
			Node<T>* backup_first;
			first = new Node<T>(data[0]);
			Node<T>* currentNode = first;
			for(int i = 1; i < size; i++){
				currentNode->next = new Node<T>(data[i]);
			}
			currentNode->next = backup_first;
		}else if(index == length){
			for(int i = 0; i < size; i++){
				last->next = new Node<T>(data[i]);
				last = last->next;
			}
		}else{
			Node<T>* currentNode = get(index-1);
			Node<T>* after = currentNode->next;
			for(int i = 0; i < size; i++){
				currentNode->next = new Node<T>(data[i]);
				currentNode = currentNode->next;
			}
			currentNode->next = after;
		}

		length += size;
	}
	T remove(int index){
		//this function can be a little more efficient but it's not a big deal
		Node<T>* nodeGet = get(index);

		if(length == 1){
			first = nullptr;
			last = nullptr;
		}else if(index == length-1){
			last = get(length-2);
			last->next = nullptr;
		}else if(index == 0){
			first = get(1);
		}else{
			Node<T>* temp = get(index-1);
			temp->next = get(index+1);
		}
		length--;

		T dataGet = nodeGet->data;
		delete nodeGet;

		return dataGet;
	}
	bool find(T key) const {
		if(length==0){
			return false;
		}

		Node<T>* currentNode = first;
		for(int i = 0; i < length; i++){
			if(currentNode->data == key){
				return true;
			}
			currentNode = currentNode->next;
		}

		return false;
	}

protected:
	Node<T>* get(int i) {
		if(i >= length){
			throw std::out_of_range(errorMessage);
		}

		if(i == 0){
			return first;
		}
		if(i == length-1){
			return last;
		}

		Node<T>* currentNode = first;
		for(int index = 0; index < i; index++){
			currentNode = currentNode->next;
		}
		return currentNode;
	}

public:
	int getLength() const {
		return length;
	}

	//all data, separated by spaces
	std::string getAllData_string() const {
		if(length == 0){
			return "";
		}
		if(length == 1){
			return std::to_string(first->data);
		}

		std::string stuff = "";
		Node<T>* currentNode = first;
		for(int i = 0; i < length-1; i++){
			stuff += (std::to_string(currentNode->data) + " ");
			currentNode = currentNode->next;
		}
		return (stuff + std::to_string(last->data));
	}
	//all data as array
	T* getAllData(){
		T* arr = new T[length];
		Node<T>* currentNode = first;
		for(int i = 0; i < length; i++){
			arr[i] = currentNode->data;
			currentNode = currentNode->next;
		}
		return arr;
	}
	/*
	//all data as vector
	std::vector<T> getAllData_vector(){
		T* arr = getAllData();
		return std::vector<T>(arr, arr + length);
		//not 100% sure if a copy happens
	}
	*/

	T* operator[](unsigned int i) const {
		return get(i)->data;
	}

	LinkedList() {
		first = nullptr;
		last = nullptr;
		length = 0;
	}
	LinkedList(T data1){
		Node<T>* temp = new Node<T>(data1);
		first = last = temp;
		length = 1;
	}
	LinkedList(T* arr, int size){
		length = size;
		if(size > 0){
			first = new Node<T>(arr[0]);
			Node<T>* currentNode = first;
			for(int i = 1; i < size; i++){
				Node<T>* temp = new Node<T>(arr[i]);
				currentNode->next = temp;
				currentNode = temp;
			}
			last = currentNode;
		} else {
			first = nullptr;
			last = nullptr;
		}
	}

	~LinkedList(){
		while(first != nullptr){
			remove(0);
			//remove() frees the memory
			//just like vector, there's a memory leak if T is a pointer because nodes don't delete their data
		}
	}

	static void reverseLL(LinkedList<T>* ll){
		int length = ll->getLength();
		if(length==0 || length==1){
			return;
		}

		Node<T>* first_backup = ll->first;
		Node<T>* prev = ll->first;
		Node<T>* after = ll->first->next;
		Node<T>* current;
		while(after != nullptr){
			current = after;
			after = after->next;
			current->next = prev;
			prev = current;
		}

		ll->first = current;
		ll->last = first_backup;
		ll->last->next = nullptr;
	}
};
template <typename T> const std::string LinkedList<T>::errorMessage = "LinkedList::out_of_range";

int main(int argc, char** argv){
	int length;
	double* arr; //assumption: data is in the form of doubles

	if(argc >= 2){
		length = argc - 1;
		arr = new double[length];
		for (int i = 1; i < argc; i++){
			std::string temp = argv[i];
			arr[i-1] = std::stod(temp);
		}
	} else {
		cout << "How many nodes? ";
		cin >> length;
		arr = new double[length];
		for (int i = 0; i < length; i++){
			cout << "Node " << (i+1) << ": ";
			std::string temp;
			cin >> temp;
			arr[i] = std::stod(temp);
		}
	}

	LinkedList<double> ll = LinkedList<double>(arr, length);
	delete[] arr;

	cout << "Linked List: " << ll.getAllData_string() << endl;
	LinkedList<double>::reverseLL(&ll);
	cout << "Reversed: " << ll.getAllData_string() << endl;

	//prettier printing for doubles:
	/*
	double* data = ll.getAllData();
	cout << "Linked List: ";
	for(int i=0; i<length-1; i++){
		cout << data[i] << " ";
	}
	cout << data[length-1] << endl;
	delete[] data;
	*/
}
