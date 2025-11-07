variable "project" {
  type    = string
  default = "innovatech"
}

variable "env" {
  type    = string
  default = "dev"
}

variable "region" {
  type    = string
  default = "eu-west-1"
}

variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}
