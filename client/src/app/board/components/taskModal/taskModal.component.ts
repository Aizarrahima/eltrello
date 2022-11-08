import { Component, HostBinding, OnDestroy } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { combineLatest, filter, Observable, map, Subject, takeUntil } from "rxjs";
import { ColumnInterface } from "src/app/shared/types/column.interface";
import { TaskInterface } from "src/app/shared/types/task.interface";
import { BoardService } from "../../services/board.service";

@Component({
  selector: 'task-modal',
  templateUrl: './taskModal.component.html',
})

export class TaskModalComponent implements OnDestroy {
  @HostBinding('class') classes = 'task-modal';

  boardId: string;
  taskId: string;
  task$: Observable<TaskInterface>
  data$: Observable<{ task: TaskInterface, columns: ColumnInterface[] }>
  columnForm = this.fb.group({
    columnId: [null],
  });
  unsubscribe$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private boardService: BoardService,
    private fb: FormBuilder,
  ) {
    const taskId = this.route.snapshot.paramMap.get('taskId');
    const boardId = this.route.parent?.snapshot.paramMap.get('boardId');

    if (!boardId) {
      throw new Error("Can't get boardId from URL");
    }

    if (!taskId) {
      throw new Error("Can't get taskId from URL");
    }

    this.taskId = taskId;
    this.boardId = boardId;
    this.task$ = this.boardService.tasks$.pipe(
      map((tasks) => {
        return tasks.find((task) => task.id === this.taskId);
      }),
      filter(Boolean)
    );
    this.data$ = combineLatest([this.task$, this.boardService.columns$]).pipe(
      map(([task, columns]) => ({
        task,
        columns,
      }))
    );

    this.task$.pipe(takeUntil(this.unsubscribe$)).subscribe((task) => {
      this.columnForm.patchValue({ columnId: task.columnId });
    })
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next()
    this.unsubscribe$.complete()
  }

  goToBoard(): void {
    this.router.navigate(['boards', this.boardId]);
  }

  updateTaskName(taskName: string): void {
    console.log('updateTaskName', taskName)
  }

  updateTaskDescription(taskDescription: string): void {
    console.log('updateTaskName', taskDescription)
  }
}
