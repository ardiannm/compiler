import { Token } from "./token.ts";

export class Character extends Token {
  constructor(public raw: string) {
    super();
  }
}