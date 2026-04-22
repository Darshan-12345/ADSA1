cmake_minimum_required(VERSION 3.16)
project(AetherDocs)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(smart_document_server
    src/main.cpp
    src/SearchEngine.cpp
)

target_include_directories(smart_document_server PRIVATE include)

if (WIN32)
    target_link_libraries(smart_document_server ws2_32)
endif()
