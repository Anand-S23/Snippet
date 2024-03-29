'use client';

import { FormEvent, MutableRefObject, useState } from 'react';
import SingularFile from './SingularFile';
import * as monaco from 'monaco-editor';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus } from 'lucide-react';
import { CREATE_REPO_ENDPOINT, UPLOAD_FILES_ENDPOINT } from '@/lib/consts';
import { CreateRepoSchema, FileDetails, FilesType, TCreateRepoSchema } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { useToast } from '../ui/use-toast';
import { useRouter } from 'next/navigation';

const CreateForm = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
        clearErrors
    } = useForm<TCreateRepoSchema>({
        resolver: zodResolver(CreateRepoSchema),
    });

    const { toast } = useToast();
    const router = useRouter();

    const [files, setFiles] = useState<Array<FileDetails>>([
        { name: '', editorRef: null }]
    );

    const addNewFile = (e: FormEvent) => {
        e.preventDefault();

        if (files.length == 5) {
            return;
        }

        const newFile: FileDetails = { 
            name: '', editorRef: null
        };
        setFiles((prevFiles) => [...prevFiles, newFile]);
    }

    const updateFilename = (index: number, filename: string) => {
        let updateFiles = [...files];
        updateFiles[index].name = filename;
        setFiles(updateFiles);
        clearErrors('root');
    }

    const updateEditorRef = (index: number, ref: MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>) => {
        let updateFiles = [...files];
        updateFiles[index].editorRef = ref;
        setFiles(updateFiles);
    }

    const deleteFile = (index: number) => {
        const updatedFiles = files.filter((_, idx) => index !== idx);
        console.log(updatedFiles)
        setFiles(updatedFiles);
    }

    const uploadFiles = async () => {
        const formData = new FormData();
        const seen = new Set();

        for (let i = 0; i < files.length; ++i) {
            const editorData = files[i].editorRef?.current?.getValue() ?? "";
            const filename = files[i].name.trim();

            if (editorData === "" || filename === "") {
                setError("root", {
                    type: "value", 
                    message: "All filenames must be set and no snippet should be empty"
                });
                return undefined;
            } else if (seen.has(filename)) {
                setError("root", {
                    type: "value", 
                    message: "Need to have unqiue filenames for snippets"
                });
                return undefined;
            }

            seen.add(filename);
            const fileData = new Blob([editorData], {type: "text/plain"});
            const file = new File([fileData], filename);
            formData.append("files", file);
        }

         const uploadResponse = await fetch(UPLOAD_FILES_ENDPOINT, {
            method: "POST",
            mode: "cors",
            body: formData,
            credentials: 'include'
        });

        return uploadResponse;
    }

    const onSubmit = async (data: TCreateRepoSchema) => {
        const uploadResponse = await uploadFiles();
        if (uploadResponse === undefined) {
            return;
        } else if (!uploadResponse.ok) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request.",
            });
            return;
        }
        const uploadFilesReponse = await uploadResponse.json() as FilesType;

        const createData = {
            name: data.name,
            description: data.description,
            files: uploadFilesReponse,
        }

         const createResponse = await fetch(CREATE_REPO_ENDPOINT, {
            method: "POST",
            mode: "cors",
            body: JSON.stringify(createData),
            headers: { "Content-Type": "application/json" },
            credentials: 'include'
        });

        const createResponseData = await createResponse.json();

        if (!createResponse.ok) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request.",
            });

            return;
        }

        if (createResponseData.id) {
            router.push(`/repo/view/${createResponseData.id}`);
        } else {
            router.push('/');
        }
    };

    return (
        <div className='sm:px-5 md:px-12 lg:px-40'>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className='p-4 pb-0'>
                    <Input 
                        {...register("name")}
                        type="text" id="name" name="name" placeholder="Repo Name"
                        className={cn("mt-2", errors.name ? 'border-red-500' : '')}
                    />
                    { errors.name && (
                        <p className="text-sm text-red-500 mx-2">
                            {`${errors.name.message}`}
                        </p>
                    )}

                    <Input 
                        {...register("description")}
                        type="text" id="description" name="description" placeholder="Description"
                        className={cn("mt-2", errors.description ? 'border-red-500' : '')}
                    />
                    { errors.description && (
                        <p className="text-sm text-red-500 mx-2">
                            {`${errors.description.message}`}
                        </p>
                    )}
                </div>

                <div>
                    <div className={errors.root ? 'border border-red-500 mt-2' : ''}>
                        { files.map((_, index) => {
                            return (
                                <SingularFile
                                    key={index}
                                    filename=''
                                    editorValue=''
                                    index={index}
                                    deleteable={files.length > 1}
                                    editable={true}
                                    setFilename={updateFilename}
                                    setEditorRef={updateEditorRef}
                                    deleteFile={deleteFile}
                                />
                            );
                        })}
                    </div>
                    { errors.root && (
                        <p className="text-sm text-red-500 mx-2">
                            {`${errors.root.message}`}
                        </p>
                    )}

                    { files.length < 5 &&
                        <Button 
                            onClick={(e) => addNewFile(e)}
                            variant={"outline"}
                            className='mx-4 mb-4 mt-2 flex justify-evenly hover:pointer border-gray-400'
                        >
                            <Plus />
                            Add Page
                        </Button>
                    }
                </div>

                <Button type="submit" className="m-4 mt-2">Submit</Button>
            </form>
        </div>
    );
};

export default CreateForm;

