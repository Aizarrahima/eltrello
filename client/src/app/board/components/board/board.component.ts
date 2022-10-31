import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, NavigationStart, Router } from "@angular/router";
import { combineLatest, filter, map, Observable } from "rxjs";
import { BoardsService } from "src/app/shared/services/boards.service";
import { ColumnsService } from "src/app/shared/services/columns.service";
import { SocketService } from "src/app/shared/services/socket.service";
import { TasksService } from "src/app/shared/services/tasks.service";
import { BoardInterface } from "src/app/shared/types/board.interface";
import { ColumnInterface } from "src/app/shared/types/column.interface";
import { ColumnInputInterface } from "src/app/shared/types/columnInput.interface";
import { SocketEventsEnum } from "src/app/shared/types/socketEvents.enum";
import { TaskInterface } from "src/app/shared/types/task.interface";
import { TaskInputInterface } from "src/app/shared/types/taskInput.interface";
import { BoardService } from "../../services/board.service";

@Component({
  selector: 'board',
  templateUrl: './board.component.html',
})

export class BoardComponent implements OnInit {
  boardId: string;
  // board$: Observable<BoardInterface>
  // columns$: Observable<ColumnInterface[]>
  data$: Observable<{
    board: BoardInterface;
    columns: ColumnInterface[];
    tasks: TaskInterface[];
  }>;


  constructor(
    private boardsService: BoardsService, // API
    private router: Router,
    private route: ActivatedRoute,
    private boardService: BoardService, // state
    private socketService: SocketService,
    private columnsService: ColumnsService,
    private tasksService: TasksService,
  ) {
    const boardId = this.route.snapshot.paramMap.get('boardId')

    if (!boardId) {
      throw new Error('Cant get boardID from url');
    }

    this.boardId = boardId;
    // this.board$ = this.boardService.board$.pipe(filter(Boolean));
    // this.columns$ = this.boardService.columns$; // simply array
    this.data$ = combineLatest([
      this.boardService.board$.pipe(filter(Boolean)),
      this.boardService.columns$,
      this.boardService.tasks$,
    ]).pipe(
      map(([board, columns, tasks]) => ({
        board,
        columns,
        tasks,
      }))
    )
  }

  ngOnInit(): void {
    this.socketService.emit(SocketEventsEnum.boardsJoin, {
      boardId: this.boardId,
    });
    this.fetchData();
    this.initializeListeners();
  }

  initializeListeners(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        // console.log("leaving a page");
        this.boardService.leaveBoard(this.boardId);
      }
    });

    this.socketService
      .listen<string>(SocketEventsEnum.columnsDeleteSuccess)
      .subscribe((columnId) => {
        this.boardService.deleteColumn(columnId);
      });

    this.socketService
      .listen<ColumnInterface>(SocketEventsEnum.columnsCreateSuccess)
      .subscribe((column) => {
        // console.log("column", column);
        this.boardService.addColumn(column);
      });

    this.socketService
      .listen<TaskInterface>(SocketEventsEnum.tasksCreateSuccess)
      .subscribe((task) => {
        this.boardService.addTask(task);
      });

    this.socketService
      .listen<BoardInterface>(SocketEventsEnum.boardsUpdateSuccess)
      .subscribe((updateBoard) => {
        this.boardService.updateBoard(updateBoard);
      });

    this.socketService
      .listen<void>(SocketEventsEnum.boardsDeleteSuccess)
      .subscribe(() => {
        this.router.navigateByUrl('/boards');
      });
  }

  fetchData(): void {
    this.boardsService.getBoard(this.boardId).subscribe((board) => {
      // console.log('board', board);
      this.boardService.setBoard(board);
    });
    this.columnsService.getColumns(this.boardId).subscribe((columns) => {
      this.boardService.setColumns(columns);
    });
    this.tasksService.getTasks(this.boardId).subscribe((tasks) => {
      this.boardService.setTasks(tasks);
    });
  }

  createColumn(title: string): void {
    // console.log("createColumn", title);
    const columnInput: ColumnInputInterface = {
      title,
      boardId: this.boardId,
    };
    this.columnsService.createColumn(columnInput);
  }

  createTask(title: string, columnId: string): void {
    const taskInput: TaskInputInterface = {
      title,
      boardId: this.boardId,
      columnId,
    };
    this.tasksService.createTask(taskInput);
  }

  getTasksByColumn(columnId: string, tasks: TaskInterface[]): TaskInterface[] {
    return tasks.filter((task) => task.columnId === columnId);
  }

  updateBoardName(boardName: string): void {
    this.boardsService.updateBoard(this.boardId, { title: boardName });
  }

  deleteBoard(): void {
    if (confirm('Are you sure you want to delete the board?')) {
      this.boardService.deleteBoard(this.boardId);
    }
  }

  deleteColumn(columnId: string): void {
    this.columnsService.deleteColumn(this.boardId, columnId);
  }
}
