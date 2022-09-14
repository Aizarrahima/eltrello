import { Component, OnInit} from "@angular/core";
import { BoardService } from "src/app/shared/services/boards.service";
import { BoardInterface } from "src/app/shared/types/board.interface";

@Component({
  selector: "boards",
  templateUrl: "./boards.component.html",
})
export class BoardsComponent implements OnInit{
  boards: BoardInterface[] = [];
  constructor(private boardService: BoardService) { }

  ngOnInit(): void {
    this.boardService.getBoards().subscribe((boards) => {
      // console.log("boards", boards);
      this.boards = boards;
    })
  }

  createBoard(title: string): void {
    // console.log("title", title);
    this.boardService.createBoard(title).subscribe((createBoard) => {
      this.boards = [...this.boards, createBoard];
    })
  }
}
