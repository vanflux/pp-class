#include <iostream>
#include <cstdlib>
#include <fstream>

using namespace std;

int N, M;

char** current_iteration;
char** new_iteration;

void alloc_memory(char* filename)
{
	ifstream f(filename);

	f>>N>>M;

	f.close();

	N = N + 2;	
	M = M + 2;

	current_iteration = new char*[N];
	new_iteration = new char*[N];

	for(int i = 0; i<N; i++)
	{
		current_iteration[i] = new char[M];
	}

	for(int i = 0; i<N; i++)
	{
		new_iteration[i] = new char[M];
	}
}

void read_initial_state(char* filename)
{
	ifstream f(filename);

	int dummy;

	f>>dummy>>dummy;

	for(int i = 1; i< N - 1; i++)
	{
		for(int j = 1; j< M - 1; j++)
		{
			f>>current_iteration[i][j];
		}
	}

	f.close();
}

void add_border()
{
	for(int i = 1; i < M - 1; i++)
	{
		current_iteration[0][i] = current_iteration[N - 2][i]; // top line
		current_iteration[N - 1][i] = current_iteration[1][i]; // bottom line
	}

	#pragma omp parallel for
	for(int i = 1; i < N - 1; i++)
	{
		current_iteration[i][0] = current_iteration[i][M - 2]; // left column
		current_iteration[i][M - 1] = current_iteration[i][1]; // right column
	}

	// corners
	current_iteration[0][0] = current_iteration[N - 2][M - 2]; // upper left
	current_iteration[0][M - 1] = current_iteration[N - 2][1]; // upper right
	current_iteration[N - 1][0] = current_iteration[1][M - 2]; // lower left
	current_iteration[N - 1][M - 1] = current_iteration[1][1]; // lower right
}

char analyze_cell(int i, int j)
{
	int alive_neighbours = 0;

	if (current_iteration[i - 1][j - 1] != '.') alive_neighbours++;
	if (current_iteration[i - 1][j] != '.') alive_neighbours++;
	if (current_iteration[i - 1][j + 1] != '.') alive_neighbours++;
	if (current_iteration[i][j - 1] != '.') alive_neighbours++;
	if (current_iteration[i][j + 1] != '.') alive_neighbours++;
	if (current_iteration[i + 1][j + 1] != '.') alive_neighbours++;
	if (current_iteration[i + 1][j] != '.') alive_neighbours++;
	if (current_iteration[i + 1][j - 1] != '.') alive_neighbours++;

	if(alive_neighbours < 2 || alive_neighbours > 3)
		return '.';

	if(current_iteration[i][j] == 'X')
		return 'X';

	if(current_iteration[i][j] == '.' && alive_neighbours == 3)
		return 'X';
  
  return '.';
}

void apply_algorithm()
{
	int i, j = 0;

	
	for(i = 1; i<N - 1; i++)
	{
		for(j = 1; j<M - 1; j++)
		{
			new_iteration[i][j] = analyze_cell(i, j);
		}
	}
}

void swap_matrix()
{
  char** aux = current_iteration;
  current_iteration = new_iteration;
  new_iteration = aux;
}

void write_final_state(char* filename)
{
	ofstream f(filename);

	for(int i = 1; i<N - 1; i++)
	{
		for(int j = 1; j<M - 1; j++)
		{
			f<<current_iteration[i][j]<<" ";
		}
		f<<endl;
	}

	f.close();
}

int main(int argc, char** argv)
{
	int iterations = atoi(argv[2]);

	alloc_memory(argv[1]);

	read_initial_state(argv[1]);
	
	for(int i = 0; i<iterations; i++)
	{
		add_border();

		apply_algorithm();

		swap_matrix();
	}

	write_final_state(argv[3]);
}
