using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WaslaApi.Migrations
{
    /// <inheritdoc />
    public partial class AddSoftDeleteAndTimestamps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Tools",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Tools",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Tools",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Tools");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Tools");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Tools");
        }
    }
}
