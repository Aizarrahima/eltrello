import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, NavigationStart, Router } from "@angular/router";
import { combineLatest, filter, map, Observable, Subject, takeUntil } from "rxjs";
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

export class BoardComponent implements OnInit, OnDestroy {
  boardId: string;
  data$: Observable<{
    board: BoardInterface;
    columns: ColumnInterface[];
    tasks: TaskInterface[];
  }>;
  unsubscribe$ = new Subject<void>();

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

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  initializeListeners(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart && !event.url.includes('/boards/')) {
        // console.log("leaving a page");
        this.boardService.leaveBoard(this.boardId);
      }
    });

    this.socketService
      .listen<string>(SocketEventsEnum.columnsDeleteSuccess)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((columnId) => {
        this.boardService.deleteColumn(columnId);
      });

    this.socketService
      .listen<ColumnInterface>(SocketEventsEnum.columnsCreateSuccess)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((column) => {
        // console.log("column", column);
        this.boardService.addColumn(column);
      });

    this.socketService
      .listen<TaskInterface>(SocketEventsEnum.tasksCreateSuccess)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((task) => {
        this.boardService.addTask(task);
      });

    this.socketService
      .listen<BoardInterface>(SocketEventsEnum.boardsUpdateSuccess)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((updatedBoard) => {
        this.boardService.updateBoard(updatedBoard);
      });

    this.socketService
      .listen<ColumnInterface>(SocketEventsEnum.columnsUpdateSuccess)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((updatedColumn) => {
        this.boardService.updateColumn(updatedColumn);
      });

    this.socketService
      .listen<TaskInterface>(SocketEventsEnum.tasksUpdateSuccess)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((updatedTask) => {
        this.boardService.updateTask(updatedTask);
      });

    this.socketService
      .listen<void>(SocketEventsEnum.boardsDeleteSuccess)
      .pipe(takeUntil(this.unsubscribe$))
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

  updatedBoardName(boardName: string): void {
    this.boardsService.updateBoard(this.boardId, { title: boardName });
  }

  updateColumnName(columnName: string, columnId: string): void {
    this.columnsService.updateColumn(this.boardId, columnId, {
      title: columnName,
    });
  }

  deleteBoard(): void {
    if (confirm('Are you sure you want to delete the board?')) {
      this.boardService.deleteBoard(this.boardId);
    }
  }

  deleteColumn(columnId: string): void {
    this.columnsService.deleteColumn(this.boardId, columnId);
  }

  openTask(taskId: string): void {
    this.router.navigate(['boards', this.boardId, 'tasks', taskId]);
  }
}
